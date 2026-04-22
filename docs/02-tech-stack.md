# Study AI · 技术栈详解

> 本文详细列出系统所有技术依赖、版本及选型理由

---

## 后端技术栈

### 核心框架

| 技术 | 版本 | 用途 | 选型理由 |
|---|---|---|---|
| Spring Boot | 3.3.6 | 主框架 | 自动配置、生态成熟 |
| Spring AI | 1.0.0-M6 | AI 集成 | 统一抽象 ChatClient/EmbeddingClient，模型无关 |
| Spring WebFlux | 6.x | 响应式流 | 支持 `Flux<String>` 流式处理 AI 回答 |
| Spring MVC | 6.x | REST API | SseEmitter 支持 SSE 推送 |
| Spring Session | 3.x | 分布式 Session | 结合 Redis 实现跨实例 Session |

### 数据层

| 技术 | 版本 | 用途 |
|---|---|---|
| MyBatis | 3.x | ORM，手写 SQL 灵活控制 |
| MySQL | 8.0 | 主数据库，存用户/对话/文档元数据 |
| Redis | 7 | Session 存储 + 配置缓存 |
| ChromaDB | latest | 向量数据库，语义检索 |

### 文件处理

| 技术 | 版本 | 用途 |
|---|---|---|
| Apache PDFBox | 2.0.30 | PDF 文本提取 |
| Apache POI (`poi-ooxml`) | 5.3.0 | Word/DOCX 文本提取 |
| Apache POI (`poi-scratchpad`) | 5.3.0 | 旧版 `.doc` 支持 |

### 外部服务集成

| 服务 | 协议 | 用途 |
|---|---|---|
| AI 大模型 API | OpenAI 兼容 REST | 生成 AI 回答 |
| Embedding API | OpenAI 兼容 REST | 文字→向量转换 |
| SearxNG | HTTP JSON | 联网搜索聚合 |

### 工具库

| 技术 | 用途 |
|---|---|
| Jackson | JSON 序列化/反序列化 |
| SLF4J + Logback | 日志 |
| Spring Boot Actuator | 健康检查 `/actuator/health` |

---

## 前端技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|---|---|---|
| React | 19.2.4 | UI 框架 |
| Vite | 8.x | 构建工具，HMR 极速热更新 |
| React Router | 7.14.1 | 前端路由（支持嵌套路由）|

### 状态管理

| 技术 | 版本 | 用途 |
|---|---|---|
| Zustand | 5.0.12 | 全局状态（用户信息、对话列表等）|
| React useState/useEffect | 内置 | 组件级状态 |

### UI & 样式

| 技术 | 版本 | 用途 |
|---|---|---|
| Tailwind CSS | 4.x | 原子化 CSS |
| Radix UI | latest | 无障碍基础组件（Dialog/Tabs/Tooltip 等）|
| framer-motion | 12.38.0 | 动画（页面切换、卡片动效）|
| lucide-react | latest | 图标库 |
| class-variance-authority | latest | 组件变体管理 |

### 内容渲染

| 技术 | 版本 | 用途 |
|---|---|---|
| marked | 18.x | Markdown → HTML |
| highlight.js | 11.x | 代码块语法高亮 |
| KaTeX | 0.16.x | LaTeX 数学公式渲染 |

### 特殊功能

| 技术 | 版本 | 用途 |
|---|---|---|
| tldraw | 4.5.9 | 画板（简历标注功能）|
| axios | 1.15.0 | HTTP 客户端（非 SSE 请求）|
| EventSource | 浏览器内置 | 接收 SSE 流式 AI 回答 |

---

## 基础设施（Docker 容器）

| 容器名 | 镜像 | 端口 | 用途 |
|---|---|---|---|
| aishow-backend | 自构建 | 8090 | Spring Boot 后端 |
| aishow-mysql | mysql:8.0 | 3306 | 数据库 |
| redis-aishow | redis:7-alpine | 6379 | 缓存/Session |
| chroma | chromadb/chroma | 8000 | 向量数据库 |
| aishow-searxng | searxng/searxng | 8081 | 联网搜索 |
| aishow-open-webui | open-webui:main | 3001 | 可选 AI 界面 |

---

## pom.xml 关键依赖

```xml
<!-- Spring AI（AI 集成核心） -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
</dependency>

<!-- WebFlux（响应式流，支持 SSE） -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>

<!-- PDF 解析 -->
<dependency>
    <groupId>org.apache.pdfbox</groupId>
    <artifactId>pdfbox</artifactId>
    <version>2.0.30</version>
</dependency>

<!-- Word 解析 -->
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.3.0</version>
</dependency>
```

---

## package.json 关键依赖

```json
{
  "dependencies": {
    "react": "^19.2.4",
    "react-router-dom": "^7.14.1",
    "zustand": "^5.0.12",
    "tldraw": "^4.5.9",
    "framer-motion": "^12.38.0",
    "marked": "^18.0.1",
    "katex": "^0.16.45",
    "highlight.js": "^11.11.1",
    "axios": "^1.15.0",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-dialog": "^1.1.15",
    "lucide-react": "^1.8.0"
  }
}
```

---

*下一篇：[03-features.md](./03-features.md)*
