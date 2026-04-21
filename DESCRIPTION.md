# Study AI — 项目技术描述

## 项目概述

Study AI 是一个面向教育场景的自托管 AI 辅助学习平台，支持私有化部署，兼容任意 OpenAI 协议大模型。系统集成了 RAG 检索增强生成、联网搜索引用溯源、深度思考可视化、多模态图片分析等核心能力，一条 `docker compose up` 命令即可完成全栈部署。

## 技术架构

```
Browser (React 18) ←→ Spring Boot 3 (SSE) ←→ LLM / ChromaDB / SearXNG
```

| 层级 | 技术 |
|---|---|
| 前端 | React 18, Vite, Tailwind CSS, Zustand, Framer Motion, KaTeX |
| 后端 | Spring Boot 3.3, Spring AI, MyBatis, Spring WebFlux (SSE) |
| 数据库 | MySQL 8 (业务), Redis (缓存/热更新) |
| 向量库 | ChromaDB (REST API, BGE-M3 Embedding) |
| 搜索 | SearXNG (自托管, 隐私优先) |
| 部署 | Docker, Docker Compose, 多阶段构建 |

## 核心技术实现

### 1. SSE 流式推送引擎
- 基于 `SseEmitter` + `Reactor Flux` 实现 token 级实时流式输出
- 共享 `ThreadPoolExecutor` 管理并发 SSE 连接，避免线程泄漏
- 支持多会话并发隔离、中断恢复、`ThreadLocal` 安全清理

### 2. RAG 检索增强生成
- 文档上传 → 智能分块 → BGE-M3 向量化 → ChromaDB 存储
- 用户提问时 Top-K 语义检索 → 上下文注入 → 引用溯源
- 向量检索失败时自动降级到关键词检索

### 3. 联网搜索 + 引用溯源
- 集成自托管 SearXNG 搜索引擎，完全私有化
- 搜索结果以结构化引用卡片展示（标题 + 摘要 + 链接）
- 前端实现 SSE 多事件类型（meta/data/refs/status）解析

### 4. 深度思考可视化
- 解析 AI 模型的 `<think>` 推理链并实时渲染为 Markdown
- 兼容 Gemma 原生 `<|channel>thought` token 格式
- 思考过程折叠/展开，历史消息自动过滤思考块以节省 token

### 5. 安全防护
- 正则模式匹配越狱检测器，覆盖 8 类攻击场景
- 会话级鉴权，防止跨用户数据越权访问
- System Prompt 加固 + 输入长度限制

### 6. 管理后台热更新
- 模型配置（API URL / Key / Model Name）在线切换，写入 Redis 实时生效
- System Prompt 在线编辑，角色分身（学生端/教师端）
- 知识库文档管理与向量化任务监控

### 7. 容器化部署
- 3 阶段 Dockerfile：Node 前端编译 → Maven 后端打包 → JRE 精简运行
- Maven 依赖缓存（`dependency:go-offline`），增量构建 ~30s
- Docker HEALTHCHECK + Actuator 健康检查

## 功能清单

- ✅ 流式对话（SSE 逐 token 推送）
- ✅ 多会话管理与历史记录
- ✅ RAG 知识库（PDF/Word/TXT）
- ✅ 联网搜索 + 来源引用
- ✅ 深度思考可视化
- ✅ 多模态图片分析
- ✅ 数学公式渲染（KaTeX）
- ✅ 暗色/亮色主题切换
- ✅ 对话导出（Markdown）
- ✅ 代码块一键复制
- ✅ 管理后台（热更新配置）
- ✅ 越狱检测 + 输入安全过滤
- ✅ Docker 一键部署
- ✅ 健康检查接口
