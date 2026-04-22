# Study AI · 功能实现详解

> 每个功能的完整实现原理、数据流向、关键代码路径

---

## 功能 1：RAG 知识库问答

### 什么是 RAG？

RAG = Retrieval-Augmented Generation（检索增强生成）

普通 AI 问答的问题：AI 只知道训练时的数据，不知道你上传的文档内容。

RAG 的解决方案：
```
上传阶段：文档 → 切片 → 向量化 → 存向量数据库
提问阶段：问题 → 向量化 → 检索相关片段 → 连同问题一起发给 AI
```

AI 就能基于你的文档内容回答，而不是"瞎编"。

### 实现流程

**① 文档上传（写入知识库）**

```
POST /api/documents/upload（教师/管理员接口）

文件 → DocumentController
     → DocumentService.saveDocument()    ← 保存文件元数据到 MySQL
     → DocumentService.rebuildChunks()  ← 文本切片
         ├─ PDFBox（PDF）
         ├─ Apache POI（DOCX/DOC）
         └─ 直接读取（TXT/MD）
     → 切片规则：800字/片，相邻片段重叠100字
     → EmbeddingService.embed(片段文本)  ← 调 BGE-M3 API 转向量
     → ChromaVectorStore.upsert()       ← 存入 ChromaDB
     → DocumentEmbeddingMapper.insert() ← MySQL 备份向量（降级用）
```

**② 用户提问（知识库检索）**

```
用户问题
  → EmbeddingService.embed(问题)         ← 问题也转成向量
  → ChromaVectorStore.query(向量, topK=4) ← 找最相似的4个片段
  → 过滤：cosine distance > 0.6 丢弃    ← 相关度不足的不用
  → 拿到 chunk_id → MySQL 查完整文本
  → 拼入 Prompt：
    "参考以下资料回答问题：
     [片段1] Spring Boot 中配置 MySQL...
     [片段2] 数据源自动配置原理...
     ---
     用户问题：Spring Boot 怎么配置数据库？"
```

**③ 降级策略**

ChromaDB 不可用时自动降级：
```java
// VectorRagService.java
try {
    results = chromaStore.query(queryVec, topK);
} catch (Exception e) {
    // 降级到 MySQL 余弦相似度
    results = fallback.search(queryVec, topK);
}
```

---

## 功能 2：流式 AI 对话

### SSE 协议

```
普通 HTTP：请求 → 等待 → 一次性返回（用户等几十秒）
SSE：      请求 → 持续推送 token → 前端实时显示（像打字机效果）
```

### 后端实现

```java
// ChatController.java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamChat(@RequestParam String message, HttpSession session) {
    SseEmitter emitter = new SseEmitter(180_000L); // 3分钟超时

    executor.submit(() -> {
        // 调 AI API，返回 Flux<String>（响应式流）
        Flux<String> flux = aiChatService.streamChat(systemPrompt, history, message);

        flux
            .doOnNext(token -> {
                try {
                    // 每个 token 推送一次
                    emitter.send(SseEmitter.event().name("data").data(token));
                } catch (Exception e) { /* 忽略推送失败 */ }
            })
            .doOnComplete(() -> {
                try {
                    emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                } catch (Exception ignored) {}
                emitter.complete();
            })
            .doOnError(e -> emitter.completeWithError(e))
            .subscribe();
    });

    return emitter;
}
```

### 前端实现

```javascript
// frontend/src/api/chat.js
export function streamChat(sessionId, message, options) {
    const es = new EventSource(
        `/api/chat/stream?sessionId=${sessionId}&message=${encodeURIComponent(message)}`
    )

    es.addEventListener('data', e => {
        options.onToken(e.data)  // 每个 token 回调
    })

    es.addEventListener('done', () => {
        es.close()
        options.onComplete()
    })

    es.onerror = (err) => {
        es.close()
        options.onError(err)
    }

    return () => es.close()  // 返回取消函数
}
```

### 对话历史管理

- 每个 Session 最多保留最近 **20 条**消息（10问10答）
- 超出时截断最早的消息（保留 System Prompt）
- 历史总字符数上限 **12000 字**，超出时截断
- 防止 token 数超过模型上下文长度限制

---

## 功能 3：联网搜索

### 工作原理

```
用户问题（开启联网模式）
    ↓
WebSearchService.search(query)
    ↓ HTTP GET（尝试顺序）
http://searxng:8080/search?q={query}&format=json   ← Docker 容器间
http://localhost:8081/search?q={query}&format=json  ← 本地开发降级
    ↓ SearxNG 并发调用
Bing · DuckDuckGo · Brave · Google（可配置）
    ↓ 聚合结果（去重、评分排序）
返回 JSON：
[
  {"title": "...", "url": "...", "content": "摘要..."},
  ...
]
    ↓ 取前 5 条有 content 的结果
拼入 AI Prompt：
"【联网搜索结果】
1. 来源：xxx.com
   摘要：...
2. ..."
```

### SearxNG 配置

配置文件：`ops/open-webui-searxng/searxng/settings.yml`

可配置的搜索引擎：
```yaml
engines:
  - name: bing
    engine: bing
    shortcut: b
  - name: duckduckgo
    engine: duckduckgo
    shortcut: d
  - name: google
    engine: google
    shortcut: g
```

---

## 功能 4：多角色权限

### 角色定义

| 角色 | 登录时填写 | 能做什么 |
|---|---|---|
| student | 学生 | 聊天、查文档、学习星图、简历优化 |
| teacher | 教师 | 以上 + 上传文档、管理知识库 |
| admin | 管理员 | 以上 + 用户管理、模型配置 |

### System Prompt 差异

**学生使用 `ai-teacher-prompt.txt`**（AI 扮演老师）：
```
你是一位耐心、专业的AI学习助手...
引导学生思考，不要直接给出答案...
```

**教师使用 `ai-assistant-prompt.txt`**（AI 扮演助手）：
```
你是一位专业的教学辅助AI...
帮助教师备课、设计教案、生成题目...
```

### 鉴权实现

```java
// LoginInterceptor.java
@Override
public boolean preHandle(HttpServletRequest request, ...) {
    String uri = request.getRequestURI();

    // 白名单：不需要登录的接口
    if (uri.startsWith("/api/user/login") ||
        uri.startsWith("/api/user/register") ||
        uri.startsWith("/actuator/health")) {
        return true;
    }

    User user = (User) request.getSession().getAttribute("currentUser");
    if (user == null) {
        response.setStatus(401);
        response.getWriter().write("{\"code\":401,\"message\":\"请先登录\"}");
        return false;
    }
    return true;
}
```

---

## 功能 5：简历优化模块

### 三大子功能

**① AI 分析**
```
上传 PDF/DOCX/TXT
  → ResumeParseService.extractText(file)
      ├─ PDFBox：PDF 文件
      ├─ POI XWPFDocument：DOCX 文件
      └─ 直接读取：TXT 文件
  → ResumeAnalyzeService.structuredExtract(text)
      └─ AI 提取结构化数据（姓名/学校/技能/项目等）→ JSON
  → 保存到 MySQL resume 表
  → SSE 流式生成分析报告（评分 + 优化建议）
  → 支持追问（针对简历内容继续对话）
```

**② 画板标注**
```
tldraw 画板组件（ResumeCanvas.jsx）
  → 用户自由标注（圈出需要修改的部分、添加注释）
  → 数据保存到 localStorage（key: canvas_resume_{id}）
  → 每份简历独立保存，互不干扰
  → 支持：画笔、箭头、文字、形状、便利贴
```

**③ 引导式学习**
```
LearningFlowPanel.jsx
  → 读取 JSON 状态机配置（flows/resume_basics.json）
  → 按步骤引导用户学习简历写作

5步流程：
  Step1: 简历基本结构介绍（文本阅读）
  Step2: STAR 法则讲解（文本阅读）
  Step3: 选择题测验（4选1）
  Step4: 实战练习（文本输入）
  Step5: AI 评估 + 总结报告（SSE 流式生成）
```

### 简历知识库（resume_kb）

独立于主知识库，存储简历相关知识：
- STAR 法则写作方法
- 技术关键词库
- 常见错误修改建议
- 量化数据指南
- GitHub 优化技巧
- Java 后端简历模板
- ...共 31 个知识片段

通过 `POST /api/resume/kb/import` 接口导入，需要 teacher/admin 权限。

---

## 功能 6：文档知识库管理

### 支持格式

| 格式 | 解析库 | 限制 |
|---|---|---|
| PDF | Apache PDFBox 2.0.30 | 10MB |
| DOCX | Apache POI poi-ooxml | 10MB |
| DOC | Apache POI poi-scratchpad | 10MB |
| TXT | Java 原生 | 10MB |
| MD | Java 原生 | 10MB |

### 切片策略

```
原文本 5000 字
  → 切片：[0:800] [700:1500] [1400:2200] ...（800字/片，100字重叠）
  → 重叠的目的：避免关键信息被切断在片段边界
  → 每片单独向量化存储
  → 检索时找最相关的片段，而不是整篇文档
```

### 向量化存储

```java
// DocumentServiceImpl.java
public void vectorizeChunks(List<DocumentChunk> chunks) {
    for (DocumentChunk chunk : chunks) {
        float[] embedding = embeddingService.embed(chunk.getContent());

        // 存 ChromaDB（主存储）
        chromaStore.upsert(
            "chunk_" + chunk.getId(),
            embedding,
            chunk.getContent(),
            Map.of("chunkId", String.valueOf(chunk.getId()))
        );

        // 存 MySQL（降级备份）
        DocumentEmbedding de = new DocumentEmbedding();
        de.setChunkId(chunk.getId());
        de.setEmbedding(serializeVector(embedding));
        embeddingMapper.insert(de);
    }
}
```

---

## 功能 7：学习画像（知识星图）

### 数据采集

每次用户提问，自动记录：
```java
// ChatServiceImpl.java
UserQuestionLog log = new UserQuestionLog();
log.setUserId(user.getId());
log.setQuestion(message);
log.setTopic(TopicClassifier.classify(message)); // 主题分类
questionLogMapper.insert(log);
```

### 主题分类

`TopicClassifier` 用关键词匹配分类：
```java
// 算法相关
if (keywords.contains("排序") || keywords.contains("动态规划") ...)
    return "algorithms";

// 网络相关
if (keywords.contains("TCP") || keywords.contains("HTTP") ...)
    return "networking";
// ...
```

### 星图可视化

`StarMap.jsx` 将各主题的提问频率渲染成星图：
- 每个主题一颗"星"
- 问得越多，星越亮越大
- 连线表示主题关联性
- 点击星星查看该主题的所有提问记录

---

## 功能 8：深度思考模式

开启后，System Prompt 追加额外指令：

```
请先在 <think>...</think> 标签内详细推理，
分析问题的各个角度，再给出最终答案。
```

AI 返回格式：
```
<think>
让我先分析这个问题...
从算法复杂度角度看...
考虑边界情况...
</think>

最终答案：...
```

前端处理：
```javascript
// MarkdownRenderer.jsx
// 解析 <think> 标签
if (content.includes('<think>')) {
    const thinkContent = content.match(/<think>(.*?)<\/think>/s)?.[1]
    const answer = content.replace(/<think>.*?<\/think>/s, '')

    return (
        <>
            <ThinkBlock content={thinkContent} />  {/* 灰色折叠块 */}
            <MarkdownContent content={answer} />   {/* 正式回答 */}
        </>
    )
}
```

---

*下一篇：[04-local-setup.md](./04-local-setup.md)*
