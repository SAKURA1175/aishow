package com.xxzd.study.service.impl;

import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.Map;
import java.util.LinkedHashMap;

import jakarta.annotation.Resource;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.xxzd.study.ai.AiChatService;
import com.xxzd.study.config.properties.AiProperties;
import com.xxzd.study.domain.ChatMessage;
import com.xxzd.study.domain.ChatSession;
import com.xxzd.study.domain.DocumentChunk;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.ChatMessageMapper;
import com.xxzd.study.mapper.ChatSessionMapper;
import com.xxzd.study.mapper.DocumentChunkMapper;
import com.xxzd.study.service.ChatService;
import com.xxzd.study.service.WebSearchService;

@Service
public class ChatServiceImpl implements ChatService {

    /** 每次 RAG 检索结果保存在此 ThreadLocal，供 Controller 读取后推送引用事件 */
    public static final ThreadLocal<List<Map<String, String>>> RAG_SOURCES = ThreadLocal.withInitial(ArrayList::new);

    public static List<Map<String, String>> getRagSources() {
        return RAG_SOURCES.get();
    }

    public static void clearRagSources() {
        RAG_SOURCES.get().clear();
    }

    @Resource
    private ChatSessionMapper chatSessionMapper;

    @Resource
    private ChatMessageMapper chatMessageMapper;

    @Resource
    private AiChatService aiChatService;

    @Resource
    private com.xxzd.study.ai.SystemPromptProvider systemPromptProvider;

    @Resource
    private DocumentChunkMapper documentChunkMapper;

    @Resource
    private com.xxzd.study.ai.VectorRagService vectorRagService;

    @Resource
    private com.xxzd.study.mapper.DocumentMapper documentMapper;

    @Resource
    private AiProperties aiProperties;

    @Resource
    private WebSearchService webSearchService;

    @Override
    @Transactional
    public ChatSession createSessionIfAbsent(User user, String title, Long sessionId) {
        if (sessionId != null) {
            ChatSession exist = chatSessionMapper.selectById(sessionId);
            if (exist != null) {
                return exist;
            }
        }
        ChatSession session = new ChatSession();
        session.setUserId(user.getId());
        if (title == null || title.isEmpty()) {
            session.setTitle("新的对话");
        } else {
            String t = title.trim();
            if (t.length() > 20) {
                t = t.substring(0, 20);
            }
            session.setTitle(t);
        }
        chatSessionMapper.insert(session);
        return session;
    }
    
    @Override
    @Transactional
    public ChatSession createSession(User user, String title) {
        ChatSession session = new ChatSession();
        session.setUserId(user.getId());
        if (title == null || title.isEmpty()) {
            session.setTitle("新的对话");
        } else {
            String t = title.trim();
            if (t.length() > 20) {
                t = t.substring(0, 20);
            }
            session.setTitle(t);
        }
        chatSessionMapper.insert(session);
        return session;
    }

    @Override
    @Transactional
    public void saveMessage(Long sessionId, String role, String content) {
        ChatMessage message = new ChatMessage();
        message.setSessionId(sessionId);
        message.setRole(role);
        message.setContent(content);
        chatMessageMapper.insert(message);
    }

    @Override
    public List<ChatSession> listSessionsByUser(Long userId) {
        return chatSessionMapper.selectByUserId(userId);
    }

    @Override
    public List<ChatMessage> listMessagesBySession(Long sessionId) {
        return chatMessageMapper.selectBySessionId(sessionId);
    }

    @Override
    @Transactional
    public void clearUserSessions(Long userId) {
        // 1. 查询用户的所有会话
        List<ChatSession> sessions = chatSessionMapper.selectByUserId(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        // 2. 删除这些会话的所有消息
        for (ChatSession session : sessions) {
            chatMessageMapper.deleteBySessionId(session.getId());
        }

        // 3. 删除会话本身
        chatSessionMapper.deleteByUserId(userId);
    }

    /**
     * 调用 AI API 获取回答（纯文字）
     */
    @Override
    public String getAiAnswer(User user, String prompt, Long sessionId) {
        try {
            // ── 安全过滤 ──────────────────────────────────────────────────────
            com.xxzd.study.ai.InputSafetyFilter.CheckResult safety =
                    com.xxzd.study.ai.InputSafetyFilter.check(prompt);
            if (safety.isUnsafe()) {
                return "⚠️ 我是学业辅助 AI 教师，只能在学业范围内为你提供帮助。如果你有学习问题，我很乐意解答！";
            }
            // 过长输入截断
            String safePrompt = com.xxzd.study.ai.InputSafetyFilter.truncate(prompt, 3000);
            String role = (user != null) ? user.getRole() : "student";
            String systemPrompt = systemPromptProvider.getPromptByRole(role);

            List<ChatMessage> history = chatMessageMapper.selectBySessionId(sessionId);
            List<ChatMessage> contextHistory = new ArrayList<>();
            if (history != null && !history.isEmpty()) {
                ChatMessage last = history.get(history.size() - 1);
                int end = history.size();
                if ("user".equals(last.getRole()) && safePrompt != null && last.getContent().trim().equals(safePrompt.trim())) {
                    end = history.size() - 1;
                }
                int start = Math.max(0, end - 10);
                for (int i = start; i < end; i++) {
                    contextHistory.add(history.get(i));
                }
            }

            String finalPrompt = buildPromptWithKnowledge(safePrompt, false);

            java.util.concurrent.CompletableFuture<String> future = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                try {
                    String answer = aiChatService.chat(systemPrompt, contextHistory, finalPrompt);
                    if (finalPrompt != null && finalPrompt.startsWith("【RAG】") && finalPrompt.contains("[资料")) {
                        String a = answer == null ? "" : answer;
                        boolean hasCitation = a.contains("资料") || a.contains("引用");
                        if (!hasCitation) {
                            String retryPrompt = finalPrompt + "\n\n【强制要求】请严格按规则重写答案，并在末尾输出引用。";
                            return aiChatService.chat(systemPrompt, contextHistory, retryPrompt);
                        }
                    }
                    return answer;
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });

            try {
                return future.get(120, java.util.concurrent.TimeUnit.SECONDS);
            } catch (java.util.concurrent.TimeoutException e) {
                future.cancel(true);
                return "抱歉，AI 思考时间过长，请稍后重试或简化问题。";
            } catch (Exception e) {
                return "错误：AI 服务调用异常：" + e.getMessage();
            }

        } catch (Exception e) {
            return "错误：系统内部错误：" + e.getMessage();
        }
    }

    /**
     * 调用 AI API 获取回答（多模态：含图片）
     */
    @Override
    public String getAiAnswerWithImage(User user, String prompt, Long sessionId,
                                       String imageBase64, String mimeType) {
        try {
            // ── 安全过滤 ──────────────────────────────────────────────────────
            com.xxzd.study.ai.InputSafetyFilter.CheckResult safety =
                    com.xxzd.study.ai.InputSafetyFilter.check(prompt);
            if (safety.isUnsafe()) {
                return "⚠️ 我是学业辅助 AI 教师，只能在学业范围内为你提供帮助。如果你有学习问题，我很乐意解答！";
            }
            String safePrompt = com.xxzd.study.ai.InputSafetyFilter.truncate(prompt, 2000);

            String role = (user != null) ? user.getRole() : "student";
            String systemPrompt = systemPromptProvider.getPromptByRole(role);

            List<ChatMessage> history = chatMessageMapper.selectBySessionId(sessionId);
            List<ChatMessage> contextHistory = new ArrayList<>();
            if (history != null && !history.isEmpty()) {
                int end = history.size();
                ChatMessage last = history.get(end - 1);
                if ("user".equals(last.getRole()) && safePrompt != null && last.getContent().trim().equals(safePrompt.trim())) {
                    end--;
                }
                int start = Math.max(0, end - 10);
                for (int i = start; i < end; i++) {
                    contextHistory.add(history.get(i));
                }
            }

            final String sp = systemPrompt;
            final List<ChatMessage> ctx = contextHistory;
            final String p = safePrompt;
            final String ib64 = imageBase64;
            final String mt = mimeType;

            java.util.concurrent.CompletableFuture<String> future = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                try {
                    return aiChatService.chatWithImage(sp, ctx, p, ib64, mt);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });

            try {
                return future.get(60, java.util.concurrent.TimeUnit.SECONDS);
            } catch (java.util.concurrent.TimeoutException e) {
                future.cancel(true);
                return "抱歉，图片分析时间过长，请尝试上传更小的图片或简化问题。";
            } catch (Exception e) {
                return "错误：AI 图片分析异常：" + e.getMessage();
            }

        } catch (Exception e) {
            return "错误：系统内部错误：" + e.getMessage();
        }
    }

    @Override
    public reactor.core.publisher.Flux<String> streamAiAnswer(User user, String prompt, Long sessionId, boolean deepThink, boolean webSearch) {
        try {
            com.xxzd.study.ai.InputSafetyFilter.CheckResult safety =
                    com.xxzd.study.ai.InputSafetyFilter.check(prompt);
            if (safety.isUnsafe()) {
                return reactor.core.publisher.Flux.just("⚠️ 我是学业辅助 AI 教师，只能在学业范围内为你提供帮助。如果你有学习问题，我很乐意解答！");
            }
            String safePrompt = com.xxzd.study.ai.InputSafetyFilter.truncate(prompt, 3000);
            String role = (user != null) ? user.getRole() : "student";
            String systemPrompt = buildTimeAwareSystemPrompt(systemPromptProvider.getPromptByRole(role));

            if (deepThink) {
                // 触发 Gemma 4 E4B 原生思考模式的特殊 token，并强制要求使用中文思考
                systemPrompt = "<|think|>\n" + systemPrompt + "\n\n【重要指令】请务必使用中文（简体）输出你的思考过程。";
            }

            List<ChatMessage> contextHistory = getContextHistory(sessionId, safePrompt);
            String finalPrompt = buildPromptWithKnowledge(safePrompt, webSearch);

            return aiChatService.streamChat(systemPrompt, contextHistory, finalPrompt)
                    .doOnNext(chunk -> System.out.print(chunk))
                    .onErrorResume(e -> reactor.core.publisher.Flux.just("错误：AI 服务调用异常：" + e.getMessage()));
        } catch (Exception e) {
            return reactor.core.publisher.Flux.just("错误：系统内部错误：" + e.getMessage());
        }
    }

    @Override
    public reactor.core.publisher.Flux<String> streamAiAnswerWithImage(User user, String prompt, Long sessionId,
                                                                       String imageBase64, String mimeType, boolean deepThink, boolean webSearch) {
        try {
            com.xxzd.study.ai.InputSafetyFilter.CheckResult safety =
                    com.xxzd.study.ai.InputSafetyFilter.check(prompt);
            if (safety.isUnsafe()) {
                return reactor.core.publisher.Flux.just("⚠️ 我是学业辅助 AI 教师，只能在学业范围内为你提供帮助。如果你有学习问题，我很乐意解答！");
            }
            String safePrompt = com.xxzd.study.ai.InputSafetyFilter.truncate(prompt, 2000);
            
            String role = (user != null) ? user.getRole() : "student";
            String systemPrompt = buildTimeAwareSystemPrompt(systemPromptProvider.getPromptByRole(role));

            if (deepThink) {
                systemPrompt = "<|think|>\n" + systemPrompt + "\n\n【重要指令】请务必使用中文（简体）输出你的思考过程。";
            }

            List<ChatMessage> contextHistory = getContextHistory(sessionId, safePrompt);

            return aiChatService.streamChatWithImage(systemPrompt, contextHistory, safePrompt, imageBase64, mimeType)
                    .doOnNext(chunk -> System.out.print(chunk))
                    .onErrorResume(e -> reactor.core.publisher.Flux.just("错误：AI 图片分析异常：" + e.getMessage()));
        } catch (Exception e) {
            return reactor.core.publisher.Flux.just("错误：系统内部错误：" + e.getMessage());
        }
    }

    private List<ChatMessage> getContextHistory(Long sessionId, String safePrompt) {
        List<ChatMessage> history = chatMessageMapper.selectBySessionId(sessionId);
        List<ChatMessage> contextHistory = new ArrayList<>();
        if (history != null && !history.isEmpty()) {
            int end = history.size();
            ChatMessage last = history.get(end - 1);
            if ("user".equals(last.getRole()) && safePrompt != null && last.getContent().trim().equals(safePrompt.trim())) {
                end--;
            }
            int maxMessages = 30;
            int maxChars = 12000;
            if (aiProperties.getRag() != null) {
                maxMessages = Math.max(4, aiProperties.getRag().getMaxHistoryMessages());
                maxChars = Math.max(2000, aiProperties.getRag().getMaxHistoryChars());
            }

            int totalChars = 0;
            for (int i = end - 1; i >= 0; i--) {
                ChatMessage message = history.get(i);
                if (message == null || message.getContent() == null || message.getContent().isBlank()) {
                    continue;
                }
                // 过滤掉深度思考过程，避免浪费上下文 token
                String cleanContent = stripThinkingBlocks(message.getContent());
                if (cleanContent.isBlank()) {
                    continue;
                }
                int nextChars = cleanContent.length();
                if (!contextHistory.isEmpty()
                        && (contextHistory.size() >= maxMessages || totalChars + nextChars > maxChars)) {
                    break;
                }
                // 使用清洗后的内容构建历史
                ChatMessage cleaned = new ChatMessage();
                cleaned.setId(message.getId());
                cleaned.setSessionId(message.getSessionId());
                cleaned.setRole(message.getRole());
                cleaned.setContent(cleanContent);
                cleaned.setCreateTime(message.getCreateTime());
                contextHistory.add(0, cleaned);
                totalChars += nextChars;
            }
        }
        return contextHistory;
    }

    /** 移除 <think>...</think> 和 Gemma 原生 channel token 块，只保留正文 */
    private String stripThinkingBlocks(String content) {
        if (content == null) return "";
        // 移除 <think>...</think> 块
        String result = content.replaceAll("<think>[\\s\\S]*?</think>", "").trim();
        // 移除 Gemma 原生 <|channel>thought...<channel|> 块
        result = result.replaceAll("<\\|channel>thought[\\s\\S]*?<channel\\|>", "").trim();
        return result;
    }

    /**
     * 在系统提示词中注入当前时间，让 AI 始终知道 "今天" 是哪天
     */
    private String buildTimeAwareSystemPrompt(String basePrompt) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Shanghai"));
        String timeInfo = now.format(java.time.format.DateTimeFormatter.ofPattern(
                "yyyy-MM-dd EEEE HH:mm", java.util.Locale.CHINESE));
        return basePrompt + "\n\n" + "【系统时间】当前时间：" + timeInfo + "。当用户询问时间相关问题时，请以此时间为准。";
    }

    private String buildPromptWithKnowledge(String question, boolean webSearch) {
        String q = question == null ? "" : question.trim();
        if (q.isEmpty()) return "";

        // 清空上一次 RAG 结果
        clearRagSources();

        // 联网搜索结果
        List<Map<String, String>> webResults = new java.util.ArrayList<>();
        if (webSearch) {
            webResults = webSearchService.search(q);
        }

        // ★ 快速预判：闲聊/非技术问题直接跳过 embedding（省去 ~1s）
        if (!needsRagSearch(q) && webResults.isEmpty()) return q;

        // 1. 向量检索（BGE-M3，优先）
        List<DocumentChunk> chunks = null;
        int topK = 4;
        if (aiProperties.getRag() != null) {
            topK = Math.max(1, aiProperties.getRag().getRetrievalTopK());
        }
        try {
            chunks = vectorRagService.search(q, topK);
        } catch (Exception ignored) {}

        // 2. 降级：关键词检索（向量服务不可用或无向量数据时）
        if (chunks == null || chunks.isEmpty()) {
            List<String> keywords = extractKeywords(q, topK + 2);
            if (!keywords.isEmpty()) {
                chunks = documentChunkMapper.selectByKeywordsLike(keywords, topK);
            }
        }

        if ((chunks == null || chunks.isEmpty()) && webResults.isEmpty()) return q;

        // 3. 构建 RAG Prompt，同时记录引用来源到 ThreadLocal
        StringBuilder kb = new StringBuilder();
        int maxPromptChars = 1400;
        int maxSnippetChars = 320;
        if (aiProperties.getRag() != null) {
            maxPromptChars = Math.max(300, aiProperties.getRag().getMaxPromptChars());
            maxSnippetChars = Math.max(120, aiProperties.getRag().getMaxSnippetChars());
        }
        int usedPromptChars = 0;
        List<Map<String, String>> sources = getRagSources();
        // 用 documentId 去重，保留最高相关的那条
        Map<Long, DocumentChunk> seenDocs = new LinkedHashMap<>();
        for (DocumentChunk c : chunks) {
            if (c == null || c.getContent() == null || c.getContent().trim().isEmpty()) continue;
            seenDocs.putIfAbsent(c.getDocumentId(), c);
        }

        int idx = 0;
        for (Map.Entry<Long, DocumentChunk> entry : seenDocs.entrySet()) {
            DocumentChunk c = entry.getValue();
            String snippet = normalizeSnippet(c.getContent());
            if (snippet.length() > maxSnippetChars) {
                snippet = snippet.substring(0, maxSnippetChars);
            }
            int remaining = maxPromptChars - usedPromptChars;
            if (remaining < 80) {
                break;
            }
            if (snippet.length() > remaining) {
                snippet = snippet.substring(0, remaining);
            }
            snippet = snippet.trim();
            if (snippet.isEmpty()) {
                continue;
            }

            kb.append("[资料").append(++idx).append("] ").append(snippet).append("\n");
            usedPromptChars += snippet.length();

            // 查文档名
            String docName = "文档 " + c.getDocumentId();
            try {
                com.xxzd.study.domain.Document doc = documentMapper.selectById(c.getDocumentId());
                if (doc != null && doc.getName() != null) {
                    docName = doc.getName();
                }
            } catch (Exception ignored) {}

            Map<String, String> ref = new LinkedHashMap<>();
            ref.put("index", String.valueOf(idx));
            ref.put("docId", String.valueOf(c.getDocumentId()));
            ref.put("docName", docName);
            ref.put("snippet", snippet.length() > 120 ? snippet.substring(0, 120) + "…" : snippet);
            sources.add(ref);
        }
        
        // 追加 Web 结果
        for (Map<String, String> res : webResults) {
            String snippet = normalizeSnippet(res.get("snippet"));
            if (snippet.length() > maxSnippetChars) {
                snippet = snippet.substring(0, maxSnippetChars);
            }
            int remaining = maxPromptChars - usedPromptChars;
            if (remaining < 80) {
                break;
            }
            if (snippet.length() > remaining) {
                snippet = snippet.substring(0, remaining);
            }
            snippet = snippet.trim();
            if (snippet.isEmpty()) {
                continue;
            }

            kb.append("[资料").append(++idx).append("] ").append(snippet).append("\n");
            usedPromptChars += snippet.length();

            Map<String, String> ref = new LinkedHashMap<>();
            ref.put("index", String.valueOf(idx));
            ref.put("docId", "web-" + idx);
            ref.put("title", res.getOrDefault("title", "网页来源"));
            ref.put("url", res.getOrDefault("url", ""));
            ref.put("docName", res.get("title") + " (联网检索)");
            ref.put("snippet", snippet.length() > 120 ? snippet.substring(0, 120) + "…" : snippet);
            sources.add(ref);
        }
        
        if (kb.length() == 0) return q;

        java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Shanghai"));
        String timeCtx = now.format(java.time.format.DateTimeFormatter.ofPattern(
                "yyyy-MM-dd EEEE HH:mm", java.util.Locale.CHINESE));

        return "【RAG】\n" +
                "【当前时间】" + timeCtx + "\n" +
                "【任务】你是学业辅助平台的AI教师。\n" +
                "【规则】\n" +
                "1. 优先使用【知识库资料】回答能覆盖的部分，并在对应段落注明引用。\n" +
                "2. 当多条资料存在矛盾时（如日期、数据不一致），以【当前时间】和最可信的来源为准，忽略明显过时的信息，直接给出最准确的答案即可，不要把所有矛盾结果都罗列出来。\n" +
                "3. 对于今天几号、现在几点等时间类问题，直接根据【当前时间】回答即可，无需引用资料。\\n" +
                "4. 资料未覆盖的部分允许补充通用解释/学习建议，但必须明确标注为\"通用补充\"。\n" +
                "5. 不得编造资料中的原文、数据、结论或引用。\n" +
                "6. 末尾输出：引用：资料1,资料2（按实际使用填写；未使用则写\"引用：无\"）。\n\n" +
                "【知识库资料】\n" + kb +
                "\n【学生问题】\n" + q;
    }

    private String normalizeSnippet(String content) {
        if (content == null) {
            return "";
        }
        return content.replaceAll("\\s+", " ").trim();
    }

    /**
     * 快速判断是否需要走 RAG 向量检索（O(1) 关键词匹配，避免所有问题都付出 1s embedding 代价）
     * 规则：
     *  - 闲聊/问候/情感类 → false（跳过）
     *  - 明确技术/知识类关键词 → true（走 RAG）
     *  - 其他 → 根据问题长度和结构判断
     */
    private boolean needsRagSearch(String q) {
        if (q == null || q.trim().isEmpty()) return false;
        String text = q.trim().toLowerCase();

        // 1. 闲聊/问候/情感黑名单 → 直接跳过 RAG
        String[] chitChat = {
            "你好", "hi", "hello", "早上好", "晚上好", "下午好", "谢谢", "感谢", "再见", "拜拜",
            "怎么了", "没事", "好的", "ok", "哈哈", "哦", "嗯", "啊", "呢",
            "你是谁", "你叫什么", "你能做什么", "帮我", "聊聊", "说说你",
            "今天", "天气", "心情", "开心", "难过", "无聊", "有趣"
        };
        for (String s : chitChat) {
            if (text.equals(s) || (text.length() <= 8 && text.contains(s))) return false;
        }

        // 2. 超短问题（≤4字）且不含技术词 → 跳过
        if (q.trim().length() <= 4) return false;

        // 3. 技术/学习类关键词白名单 → 走 RAG
        String[] techWords = {
            // 编程语言
            "java", "python", "spring", "javascript", "typescript", "go", "rust", "c++", "kotlin", "scala",
            // AI/ML
            "langchain", "langraph", "llm", "rag", "agent", "embedding", "向量", "神经网络", "机器学习",
            "深度学习", "transformer", "gpt", "claude", "gemini", "ollama", "huggingface",
            // 框架/工具
            "react", "vue", "docker", "kubernetes", "redis", "mysql", "mongodb", "kafka", "nginx",
            "mybatis", "hibernate", "fastapi", "django", "flask", "gradle", "maven",
            // 计算机基础
            "算法", "数据结构", "操作系统", "计算机网络", "设计模式", "微服务", "分布式",
            "并发", "多线程", "进程", "内存", "缓存", "索引", "事务", "锁",
            // 概念性问题
            "原理", "实现", "架构", "原因", "区别", "对比", "优缺点", "如何", "怎么",
            "什么是", "为什么", "怎样", "教我", "解释", "分析", "举例", "代码",
            // 文档类
            "文档", "资料", "知识库", "教材", "笔记", "api", "函数", "方法", "类", "接口"
        };
        for (String kw : techWords) {
            if (text.contains(kw)) return true;
        }

        // 4. 问句 + 中等长度（很可能是知识问题）
        boolean isQuestion = text.contains("？") || text.contains("?") || text.contains("吗") ||
                             text.contains("呢") || text.contains("嘛") || text.contains("怎") ||
                             text.contains("什么") || text.contains("为什么") || text.contains("如何");
        if (isQuestion && q.trim().length() >= 8) return true;

        // 5. 其余情况跳过（不值得付出 embedding 代价）
        return false;
    }

    private boolean shouldUseKnowledgeBase(String question) {
        if (question == null) {
            return false;
        }
        String q = question.trim();
        if (q.isEmpty()) {
            return false;
        }

        String lower = q.toLowerCase();
        if (lower.contains("rag")) {
            return true;
        }

        String[] directHints = new String[]{
                "文档", "资料", "知识库", "文档库", "上传", "文件", "附件", "讲义", "课件", "ppt", "pptx",
                "教材", "笔记", "pdf", "doc", "docx", "txt", "这份", "这个文件", "这篇资料", "这篇文档",
                "在文档中", "在资料里", "在知识库中", "从文档", "根据文档", "根据资料", "引用资料", "引用文档"
        };
        for (String h : directHints) {
            if (h != null && !h.isEmpty() && lower.contains(h)) {
                return true;
            }
        }

        return false;
    }


    private List<String> extractKeywords(String text, int limit) {
        String normalized = normalizeForKeyword(text);
        if (normalized.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        if (!normalized.contains(" ") && containsCjk(normalized)) {
            Set<String> uniq = new LinkedHashSet<>();
            int max = Math.min(normalized.length(), 30);
            String shortText = normalized.substring(0, max);
            for (int i = 0; i < shortText.length() - 1; i++) {
                String bi = shortText.substring(i, i + 2);
                if (bi.trim().isEmpty()) {
                    continue;
                }
                uniq.add(bi);
                if (uniq.size() >= limit) {
                    break;
                }
            }
            if (!uniq.isEmpty()) {
                return new ArrayList<>(uniq);
            }
        }

        String[] parts = normalized.split("\\s+");
        Set<String> uniq = new LinkedHashSet<>();
        for (String p : parts) {
            if (p == null) {
                continue;
            }
            String s = p.trim();
            if (s.isEmpty()) {
                continue;
            }
            if (s.length() >= 2) {
                uniq.add(s);
            }
            if (uniq.size() >= limit) {
                break;
            }
        }

        if (uniq.isEmpty()) {
            int len = Math.min(text.length(), 12);
            String fallback = text.substring(0, len).trim();
            if (!fallback.isEmpty()) {
                uniq.add(fallback);
            }
        }

        return new ArrayList<>(uniq);
    }

    private boolean containsCjk(String text) {
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            if (ch >= 0x4E00 && ch <= 0x9FFF) {
                return true;
            }
        }
        return false;
    }

    private String normalizeForKeyword(String text) {
        if (text == null) {
            return "";
        }
        String t = text;
        t = t.replaceAll("[\\p{P}\\p{S}]", " ");
        t = t.replaceAll("\\s+", " ");
        return t.trim();
    }

}
