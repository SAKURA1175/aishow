package com.xxzd.study.service.impl;

import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.annotation.Resource;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.xxzd.study.ai.AiChatService;
import com.xxzd.study.domain.ChatMessage;
import com.xxzd.study.domain.ChatSession;
import com.xxzd.study.domain.DocumentChunk;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.ChatMessageMapper;
import com.xxzd.study.mapper.ChatSessionMapper;
import com.xxzd.study.mapper.DocumentChunkMapper;
import com.xxzd.study.service.ChatService;

@Service
public class ChatServiceImpl implements ChatService {

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

            String finalPrompt = buildPromptWithKnowledge(safePrompt);

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
    public reactor.core.publisher.Flux<String> streamAiAnswer(User user, String prompt, Long sessionId, boolean deepThink) {
        try {
            com.xxzd.study.ai.InputSafetyFilter.CheckResult safety =
                    com.xxzd.study.ai.InputSafetyFilter.check(prompt);
            if (safety.isUnsafe()) {
                return reactor.core.publisher.Flux.just("⚠️ 我是学业辅助 AI 教师，只能在学业范围内为你提供帮助。如果你有学习问题，我很乐意解答！");
            }
            String safePrompt = com.xxzd.study.ai.InputSafetyFilter.truncate(prompt, 3000);
            String role = (user != null) ? user.getRole() : "student";
            String systemPrompt = systemPromptProvider.getPromptByRole(role);

            if (deepThink) {
                // 触发 Gemma 4 E4B 原生思考模式的特殊 token，并强制要求使用中文思考
                systemPrompt = "<|think|>\n" + systemPrompt + "\n\n【重要指令】请务必使用中文（简体）输出你的思考过程。";
            }

            List<ChatMessage> contextHistory = getContextHistory(sessionId, safePrompt);
            String finalPrompt = buildPromptWithKnowledge(safePrompt);

            return aiChatService.streamChat(systemPrompt, contextHistory, finalPrompt)
                    .doOnNext(chunk -> System.out.print(chunk))
                    .onErrorResume(e -> reactor.core.publisher.Flux.just("错误：AI 服务调用异常：" + e.getMessage()));
        } catch (Exception e) {
            return reactor.core.publisher.Flux.just("错误：系统内部错误：" + e.getMessage());
        }
    }

    @Override
    public reactor.core.publisher.Flux<String> streamAiAnswerWithImage(User user, String prompt, Long sessionId,
                                                                       String imageBase64, String mimeType, boolean deepThink) {
        try {
            com.xxzd.study.ai.InputSafetyFilter.CheckResult safety =
                    com.xxzd.study.ai.InputSafetyFilter.check(prompt);
            if (safety.isUnsafe()) {
                return reactor.core.publisher.Flux.just("⚠️ 我是学业辅助 AI 教师，只能在学业范围内为你提供帮助。如果你有学习问题，我很乐意解答！");
            }
            String safePrompt = com.xxzd.study.ai.InputSafetyFilter.truncate(prompt, 2000);
            
            String role = (user != null) ? user.getRole() : "student";
            String systemPrompt = systemPromptProvider.getPromptByRole(role);

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
            int start = Math.max(0, end - 10);
            for (int i = start; i < end; i++) {
                contextHistory.add(history.get(i));
            }
        }
        return contextHistory;
    }

    private String buildPromptWithKnowledge(String question) {
        String q = question == null ? "" : question.trim();
        if (q.isEmpty()) return "";

        // 1. 向量检索（BGE-M3，优先）
        List<DocumentChunk> chunks = null;
        try {
            chunks = vectorRagService.search(q, 6);
        } catch (Exception ignored) {}

        // 2. 降级：关键词检索（向量服务不可用或无向量数据时）
        if (chunks == null || chunks.isEmpty()) {
            if (!shouldUseKnowledgeBase(q)) return q;
            List<String> keywords = extractKeywords(q, 6);
            if (!keywords.isEmpty()) {
                chunks = documentChunkMapper.selectByKeywordsLike(keywords, 6);
            }
        }

        if (chunks == null || chunks.isEmpty()) return q;

        // 3. 构建 RAG Prompt
        StringBuilder kb = new StringBuilder();
        int idx = 0;
        for (DocumentChunk c : chunks) {
            if (c == null || c.getContent() == null) continue;
            String snippet = c.getContent().trim();
            if (snippet.isEmpty()) continue;
            if (snippet.length() > 500) snippet = snippet.substring(0, 500);
            kb.append("[资料").append(++idx).append("] ").append(snippet).append("\n");
        }
        if (kb.length() == 0) return q;

        return "【RAG】\n" +
                "【任务】你是学业辅助平台的AI教师。\n" +
                "【规则】\n" +
                "1. 优先使用【知识库资料】回答能覆盖的部分，并在对应段落注明引用。\n" +
                "2. 资料未覆盖的部分允许补充通用解释/学习建议，但必须明确标注为\"通用补充\"。\n" +
                "3. 不得编造资料中的原文、数据、结论或引用。\n" +
                "4. 末尾输出：引用：资料1,资料2（按实际使用填写；未使用则写\"引用：无\"）。\n\n" +
                "【知识库资料】\n" + kb +
                "\n【学生问题】\n" + q;
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
