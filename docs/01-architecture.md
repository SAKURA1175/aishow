# Study AI · 系统架构详解

> 从宏观到微观逐层解析 Study AI 的整体架构

---

## 1. 一句话介绍

Study AI 是一个基于 **RAG（检索增强生成）** 技术的 AI 学业辅助平台，支持知识库问答、联网搜索、简历优化、引导式学习等功能，面向高校师生使用。

---

## 2. 整体架构图

```
┌──────────────────────────────────────────────────────┐
│                    用户浏览器                          │
│  React 19 · Vite 8 · Zustand · Tailwind CSS          │
│  tldraw · marked+KaTeX · framer-motion · Radix UI    │
└───────────────────────┬──────────────────────────────┘
                        │ HTTP / SSE
┌───────────────────────▼──────────────────────────────┐
│               Nginx（反向代理）                         │
│  /         → 前端静态文件 /var/www/html                │
│  /api/*    → http://localhost:8090                    │
└───────────────────────┬──────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────┐
│          Spring Boot 3.3 后端  :8090                   │
│                                                      │
│  Controller层（4个）：                                 │
│  ChatController · DocumentController                  │
│  ResumeController · AdminController                   │
│                                                      │
│  Service层：                                          │
│  ChatService · DocumentService                        │
│  ResumeAnalyzeService · LearningFlowEngine            │
│  WebSearchService · UserService                       │
│                                                      │
│  AI Pipeline：                                        │
│  SpringAiChatService → ChatClient(Spring AI)          │
│  VectorRagService → ChromaVectorStore                 │
│  EmbeddingService → Embedding API                     │
└──────┬──────────────┬───────────────┬────────────────┘
       │              │               │
  ┌────▼────┐   ┌─────▼────┐  ┌──────▼──────────────┐
  │ AI API  │   │  MySQL   │  │ ChromaDB | Redis     │
  │DeepSeek │   │ :3306    │  │ :8000    | :6379     │
  │通义千问  │   │          │  │ 向量数据库 | Session  │
  └────┬────┘   └──────────┘  └─────────────────────┘
       │
  ┌────▼──────────────────────────────┐
  │  SearxNG  :8081                   │
  │  联网搜索聚合（Bing/DuckDuckGo等） │
  └───────────────────────────────────┘
```

---

## 3. 一次完整请求的生命周期

以用户发送"Spring Boot 怎么配置数据库？"为例：

```
① 用户点击发送
        ↓
② 前端：EventSource 连接 /api/chat/stream
        ↓
③ LoginInterceptor：检查 Session，未登录返回 401
        ↓
④ ChatController：解析参数，创建 SseEmitter
        ↓
⑤ ChatService 开始处理：
   ├─ [可选] WebSearchService.search()
   │    └─ 调 SearxNG → 拿到实时搜索结果
   │
   ├─ VectorRagService.search()
   │    ├─ EmbeddingService.embed(问题) → 1024维向量
   │    ├─ ChromaVectorStore.query(向量, topK=4)
   │    └─ 过滤相关度 < 0.4 的结果
   │
   ├─ SystemPromptProvider.getPromptByRole(role)
   │    └─ 按角色加载 System Prompt 文件
   │
   └─ 组装完整 Prompt：
        系统指令 + 知识库片段 + 搜索结果 + 对话历史 + 用户问题
        ↓
⑥ SpringAiChatService.streamChat()
   └─ 调 DeepSeek API → 返回 Flux<String>
        ↓
⑦ SseEmitter 逐 token 推送：
   event: data \n data: 在 \n\n
   event: data \n data: Spring \n\n
   ...
   event: done \n data: [DONE] \n\n
        ↓
⑧ 前端 EventSource 接收，实时追加到页面
```

---

## 4. 核心设计决策

### 为什么用 SSE 而不是 WebSocket？

SSE 是单向推送，对 AI 流式回答场景完全够用：
- 实现更简单（标准 HTTP，Spring MVC 原生支持）
- Nginx 配置更容易（只需 `proxy_buffering off`）
- 浏览器原生支持 `EventSource`，无需额外库

### 为什么同时保留 MySQL Embedding 备份？

ChromaDB 是内存型数据库，重启后需要重新加载。当 ChromaDB 不可用时，系统会自动降级到 MySQL 存储的 embedding 向量做余弦相似度计算，保证服务可用性。

### 为什么用 OpenAI 兼容协议？

所有主流大模型厂商（DeepSeek/通义千问/智谱/Moonshot）都提供 OpenAI 兼容接口，只需修改配置中的 `url` 和 `key`，无需改代码即可切换模型。

### 知识库隔离（resume_kb）

简历知识库与主知识库通过 ChromaDB 的不同 Collection 物理隔离：
```java
// 主知识库（study_docs collection）
ChromaVectorStore mainStore;

// 简历专用（resume_kb collection）
ChromaVectorStore resumeKb = mainStore.withCollection("resume_kb");
```
两者数据完全独立，互不干扰。

---

## 5. 降级策略总览

| 组件 | 正常路径 | 降级路径 | 影响 |
|---|---|---|---|
| 向量检索 | ChromaDB 语义搜索 | MySQL 余弦相似度 | 检索速度略慢 |
| 联网搜索 | SearxNG 聚合 | 跳过，仅用知识库 | 无实时信息 |
| Embedding | 远程 API | 关闭 RAG | 无知识库检索 |

---

*下一篇：[02-tech-stack.md](./02-tech-stack.md)*
