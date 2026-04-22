# Study AI 系统技术文档

> AI 驱动的学业辅助平台 | Spring Boot + React + RAG + 向量数据库

---

## 目录

1. [系统架构总览](#1-系统架构总览)
2. [技术栈详解](#2-技术栈详解)
3. [核心功能实现原理](#3-核心功能实现原理)
4. [数据库设计](#4-数据库设计)
5. [部署指南（本地 & 云端）](#5-部署指南)

---

## 1. 系统架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
│              React 19 + Vite + Tailwind CSS                  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / SSE（流式推送）
┌───────────────────────▼─────────────────────────────────────┐
│                   Spring Boot 3.3 后端                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Chat    │  │ Document │  │  Resume  │  │  Admin   │   │
│  │Controller│  │Controller│  │Controller│  │Controller│   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │          │
│  ┌────▼──────────────▼──────────────▼──────────── ▼──────┐  │
│  │               核心服务层                                │  │
│  │  ChatService  DocumentService  ResumeAnalyzeService   │  │
│  │  LearningFlowEngine  WebSearchService                 │  │
│  └────┬──────────────┬──────────────┬────────────────────┘  │
│       │              │              │                         │
│  ┌────▼────┐   ┌─────▼────┐  ┌─────▼──────┐                │
│  │Spring AI│   │MyBatis   │  │ AI Pipeline │               │
│  │ChatClient│  │(MySQL)   │  │ RAG Engine  │               │
│  └────┬────┘   └─────┬────┘  └─────┬───────┘               │
│       │              │              │                         │
└───────┼──────────────┼──────────────┼─────────────────────── ┘
        │              │              │
   ┌────▼────┐   ┌─────▼────┐  ┌─────▼──────────────────┐
   │  AI API │   │  MySQL   │  │  ChromaDB  │  Redis     │
   │(OpenAI  │   │  数据库   │  │  向量数据库  │  会话缓存  │
   │兼容接口) │   │          │  │            │            │
   └─────────┘   └──────────┘  └────────────────────────┘
                                        │
                               ┌────────▼────────┐
                               │  Embedding API   │
                               │  (BGE-M3 模型)   │
                               └─────────────────┘
```

### 请求完整生命周期（以 AI 问答为例）

```
用户输入问题
   ↓
1. LoginInterceptor（Session 鉴权拦截）
   ↓
2. ChatController（接收请求，创建 SseEmitter）
   ↓
3. ChatServiceImpl.getAiAnswer()
   ├── WebSearchService.search()          （若开启联网，调 SearxNG）
   ├── VectorRagService.search()          （知识库语义检索）
   │    ├── EmbeddingService.embed()      （问题向量化 → BGE-M3）
   │    ├── ChromaVectorStore.query()     （向量相似度检索）
   │    └── MySQL fallback               （Chroma 不可用时降级）
   ├── SystemPromptProvider.getPrompt()   （按角色加载 System Prompt）
   └── SpringAiChatService.streamChat()  （调 AI API 流式返回）
        ↓ Flux<String> token流
4. SSE 逐 token 推送到浏览器
   ↓
5. React 前端 EventSource 接收，实时渲染 Markdown
```

---

## 2. 技术栈详解

### 后端

| 组件 | 版本 | 用途 |
|---|---|---|
| Spring Boot | 3.3.6 | 主框架 |
| Spring AI | 1.0.0-M6 | AI 集成（ChatClient, Embedding）|
| Spring WebFlux | 6.x | 响应式流（SSE 推送）|
| MyBatis | 3.x | ORM 框架 |
| MySQL | 8.0 | 主数据库（用户、文档、对话）|
| Redis | 7 | 分布式 Session + 缓存 |
| ChromaDB | latest | 向量数据库（语义检索）|
| Apache PDFBox | 2.0.30 | PDF 文本提取 |
| Apache POI | 5.3.0 | Word/DOCX 文本提取 |
| SearxNG | latest | 自托管搜索引擎（联网搜索）|

### 前端

| 组件 | 版本 | 用途 |
|---|---|---|
| React | 19.x | UI 框架 |
| Vite | 8.x | 构建工具 |
| Tailwind CSS | 4.x | 样式 |
| framer-motion | 12.x | 动画效果 |
| Zustand | 5.x | 全局状态管理 |
| tldraw | 4.x | 画板（简历标注）|
| marked + KaTeX | latest | Markdown + 数学公式渲染 |
| Radix UI | latest | 无障碍 UI 组件库 |
| React Router | 7.x | 前端路由 |

---

## 3. 核心功能实现原理

### 3.1 AI 问答（RAG 增强检索）

**RAG（Retrieval-Augmented Generation）** = 检索增强生成，让 AI 回答基于你自己的知识库而非纯粹靠训练数据。

```
完整 RAG Pipeline：

用户问题 "Spring Boot 怎么配置 Redis？"
    ↓ EmbeddingService
向量化 → [0.23, -0.45, 0.12, ...] (1024维)
    ↓ ChromaVectorStore.query(向量, topK=4)
ChromaDB 找最近邻 → 返回相似片段:
    - "Redis 配置文档第3页：spring.data.redis.host=..."
    - "Spring Boot 自动配置笔记..."
    ↓ 过滤（距离 < 0.6）
组装 System Prompt：
    "你是学习助手... 参考以下资料：{知识库片段}"
    ↓ SpringAiChatService.streamChat()
AI API → 流式生成回答
    ↓ Flux<String>
SSE → 浏览器实时渲染
```

**降级策略**：ChromaDB 不可用时自动降级到 MySQL 余弦相似度（`DocumentEmbeddingFallback`），保证可用性。

**代码关键路径**：
```java
// ChatServiceImpl.java
VectorRagService.search(question, topK)  // 语义检索
    → EmbeddingService.embed()           // BGE-M3 向量化
    → ChromaVectorStore.query()          // Chroma 检索
    → 返回 DocumentChunk 列表

// 拼装 prompt
String context = chunks.stream()
    .map(c -> c.getContent())
    .collect(joining("\n---\n"));

// 流式回答
aiChatService.streamChat(systemPrompt, history, userQuestion)
    → Flux<String>  // 逐token推送
```

---

### 3.2 SSE 流式推送

避免 AI 生成需要等待几十秒才能看到结果，实现"逐字打印"效果。

```
后端：SseEmitter（Spring MVC）
前端：EventSource（浏览器原生 API）

后端推送格式：
event: data
data: 今

event: data
data: 天

event: done
data: [DONE]
```

**代码关键路径**：
```java
// ChatController.java
SseEmitter emitter = new SseEmitter(180_000L); // 3分钟超时
executor.submit(() -> {
    aiFlux.doOnNext(token -> 
        emitter.send(event().name("data").data(token))
    ).doOnComplete(() ->
        emitter.send(event().name("done").data("[DONE]"))
    ).subscribe();
});
return emitter;

// 前端 React
const es = new EventSource('/api/chat/stream')
es.addEventListener('data', e => setContent(c => c + e.data))
es.addEventListener('done', () => es.close())
```

---

### 3.3 联网搜索（SearxNG）

不依赖 Google/Bing API Key，完全自托管。

```
架构：
用户点「联网搜索」
    ↓
WebSearchService.search(query)
    ↓ HTTP GET
SearxNG（自托管）http://searxng:8080/search?q=xxx&format=json
    ↓ 并发爬取
Bing + DuckDuckGo + Brave Search + 百度（可配置）
    ↓ 聚合结果（去重、排序）
返回 Top 5 条 {title, url, snippet}
    ↓
注入到 AI System Prompt：
"联网搜索结果：
1. [来源: xxx.com] 内容片段...
2. ..."
    ↓
AI 基于实时信息回答
```

**降级**：若 SearxNG 不可用，跳过联网，仍用知识库回答。

---

### 3.4 多角色权限系统

```
角色：student / teacher / admin

鉴权：Session-based（Redis 存 Session）
    LoginInterceptor → 检查 session.getAttribute("currentUser")
    → 未登录 → 返回 401
    → 已登录 → 放行

不同角色使用不同 System Prompt：
    student  → ai-teacher-prompt.txt   （像老师一样引导学习）
    teacher  → ai-assistant-prompt.txt （像助手一样辅助备课）
    admin    → 可进入后台管理界面
```

---

### 3.5 文档知识库

教师/管理员上传文档 → 自动向量化 → 学生问答时自动检索。

```
上传流程：
PDF/DOCX/TXT/MD 文件
    ↓ DocumentService.saveDocument()    MySQL 存元数据
    ↓ DocumentService.rebuildChunks()   文本切片（800字/片，100字重叠）
    ↓ EmbeddingService.embed()          BGE-M3 向量化
    ↓ ChromaVectorStore.upsert()        存入 ChromaDB
    ↓ MySQL DocumentEmbedding           备份向量（降级用）
```

---

### 3.6 学习画像（知识星图）

自动追踪学生提问，生成个人化知识地图。

```
UserQuestionLog 表记录每次提问
    ↓ TopicClassifier（关键词分类）
归类到知识领域（算法/网络/数据库/...）
    ↓ LearningProfileService
更新 LearningProfile（各领域掌握程度）
    ↓ StarMap.jsx 前端
D3.js / SVG 可视化星图
```

---

### 3.7 简历优化模块（新）

```
上传简历（PDF/DOCX/TXT）
    ↓ ResumeParseService     （PDFBox / POI 文本提取）
    ↓ ResumeAnalyzeService   （AI 结构化解析 → JSON）
    ↓ 流式分析报告            （SSE 推送 Markdown）
    ↓ ResumeKbService        （独立 resume_kb ChromaDB collection）

三个功能 Tab：
1. AI 分析 - 上传简历 → AI 生成优化报告 + 追问
2. 画板标注 - tldraw 自由画板（per-resume localStorage 持久化）
3. 引导学习 - 5步交互式写作课（选择题 + 文本输入 + AI反馈）
```

---

### 3.8 深度思考模式

```
前端 - 「深度思考」开关
    ↓
ChatController 接收 enableDeepThink=true
    ↓
System Prompt 注入额外指令：
    "请先 <think> 标签内进行详细推理，再给出最终答案"
    ↓
AI 响应中 <think>...</think> 内容
    ↓ 前端特殊渲染
灰色折叠框显示思维链
正文显示最终答案
```

---

## 4. 数据库设计

### 核心表结构

```sql
-- 用户表
user (id, username, password_hash, role, create_time)

-- 对话表
chat_session (id, user_id, title, create_time)
chat_message (id, session_id, role, content, tokens, create_time)

-- 文档知识库
document (id, filename, file_type, uploader_id, create_time)
document_chunk (id, doc_id, content, chunk_index, char_count)
document_embedding (id, chunk_id, embedding BLOB)  -- 降级备份

-- 学习追踪
user_question_log (id, user_id, question, topic, create_time)
learning_profile (id, user_id, topic_data JSON, update_time)

-- 简历优化（新）
resume (id, user_id, filename, file_type, raw_text, structured_json,
        analysis_json, score, create_time)
learning_flow_progress (id, user_id, flow_type, current_step,
                        total_steps, step_data JSON, status)
```

---

## 5. 部署指南

### 方案一：本地开发环境

#### 前提条件
- Java 21+
- Node.js 20+
- Docker Desktop
- LM Studio（本地 AI 模型）或 AI API Key

#### 步骤

**1. 拉取代码**
```bash
git clone https://github.com/SAKURA1175/aishow.git
cd aishow
```

**2. 启动依赖服务**
```bash
# 启动 MySQL + Redis + ChromaDB + SearxNG
docker-compose up -d
```

**3. 配置 AI 模型**

编辑 `src/main/resources/redis.properties`：
```properties
# 本地 LM Studio
ai.model=gemma-4-e4b-it
ai.api.url=http://localhost:1234
ai.api.key=lm-studio

# 或使用 DeepSeek API
# ai.model=deepseek-chat
# ai.api.url=https://api.deepseek.com/v1
# ai.api.key=sk-你的key
```

**4. 初始化数据库**
```bash
# 建表
docker exec -i aishow-mysql mysql -uroot -p1234 study_ai < sql/init.sql
docker exec -i aishow-mysql mysql -uroot -p1234 study_ai < sql/resume_module.sql
```

**5. 启动后端**
```bash
mvn spring-boot:run
# 或
mvn package -DskipTests && java -jar target/*.jar
```

**6. 启动前端**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

**7. 初始化知识库**
```bash
cd kb_data
python3 scrape_and_import.py      # 主知识库（Wikipedia + GitHub）
python3 resume_kb_init.py         # 简历知识库
```

---

### 方案二：Docker 一键部署（推荐生产）

#### 所需环境变量

创建 `.env` 文件：
```bash
# AI 模型（选一个）
AISHOW_AI_MODEL=deepseek-chat
AISHOW_AI_API_URL=https://api.deepseek.com/v1
AISHOW_AI_API_KEY=sk-你的DeepSeek密钥

# Embedding 模型（硅基流动免费）
AISHOW_AI_EMBEDDING_MODEL=BAAI/bge-m3
AISHOW_AI_EMBEDDING_API_URL=https://api.siliconflow.cn/v1
AISHOW_AI_EMBEDDING_API_KEY=sk-你的硅基流动密钥

# 数据库
AISHOW_JDBC_URL=jdbc:mysql://aishow-mysql:3306/study_ai?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
AISHOW_JDBC_USERNAME=root
AISHOW_JDBC_PASSWORD=自定义强密码

# Redis
AISHOW_REDIS_HOST=redis-aishow

# ChromaDB（容器间通信，无需改）
AISHOW_AI_CHROMA_BASE_URL=http://chroma:8000/api/v2

# 端口（可选）
AISHOW_BACKEND_PORT=8090
AISHOW_SEARXNG_PORT=8081
```

#### 一键启动
```bash
docker-compose --env-file .env up -d
# 等待约30秒启动完毕
curl http://localhost:8090/actuator/health  # 验证后端
```

---

### 方案三：Oracle Cloud 免费服务器 + Cloudflare Pages（完全免费）

#### 架构
```
用户
 ↓ HTTPS
Cloudflare Pages（前端，全球 CDN 免费）
 ↓ 代理 /api/*
Oracle Cloud ARM VM 4核24G（后端 + 数据库）
 ├── aishow-backend:8090
 ├── aishow-mysql:3306
 ├── redis-aishow:6379
 ├── chroma:8000
 └── aishow-searxng:8081
```

#### Oracle Cloud 部署步骤

**1. 创建实例**
- 注册 Oracle Cloud（信用卡验证，不扣费）
- 创建 Always Free VM：Ampere A1（4 OCPU, 24GB）
- 镜像选：Ubuntu 22.04
- 开放安全组端口：22(SSH), 80, 443, 8090

**2. 安装 Docker**
```bash
# SSH 连接服务器
ssh ubuntu@你的服务器IP

# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**3. 部署应用**
```bash
git clone https://github.com/SAKURA1175/aishow.git
cd aishow
cp .env.example .env
# 编辑 .env 填入 API Key
vim .env

# 拉起所有服务
docker-compose --env-file .env up -d

# 建表
docker exec -i aishow-mysql mysql -uroot -p${AISHOW_JDBC_PASSWORD} study_ai < sql/init.sql
docker exec -i aishow-mysql mysql -uroot -p${AISHOW_JDBC_PASSWORD} study_ai < sql/resume_module.sql
```

**4. 前端部署到 Cloudflare Pages**

```bash
# 本地构建（或在 CI 中构建）
cd frontend

# 修改 vite.config.js，将 API 代理改为你的服务器 IP
# target: 'http://你的服务器IP:8090'

npm run build  # 生成 dist/
```

在 Cloudflare Dashboard：
1. Pages → Create project → 连接 GitHub 仓库
2. Build command: `cd frontend && npm run build`
3. Build output: `frontend/dist`
4. 环境变量：`VITE_API_BASE=/api`

> [!TIP]
> Cloudflare Pages 的 Functions 可作为 API 代理，避免暴露服务器 IP。

**5. 配置 Nginx（服务器上）**

```nginx
# /etc/nginx/sites-available/aishow
server {
    listen 80;
    server_name 你的域名或IP;

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8090/api/;
        proxy_set_header Host $host;
        proxy_buffering off;              # SSE 必须关闭缓冲
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

---

## API 密钥申请指南

| 服务 | 申请地址 | 免费额度 | 推荐用途 |
|---|---|---|---|
| **DeepSeek** | platform.deepseek.com | ¥10试用 | 主AI模型 |
| **硅基流动** | siliconflow.cn | ¥14免费 | Embedding模型 |
| **智谱 GLM-4-Flash** | open.bigmodel.cn | 免费tier | 备选AI模型 |
| **Gemini Flash** | aistudio.google.com | 免费tier（需中转）| 备选 |

---

## 常见问题

### Q: ChromaDB 连不上怎么办？
系统自动降级到 MySQL 余弦相似度，功能正常，只是检索精度略低。检查：
```bash
curl http://localhost:8000/api/v2/heartbeat
```

### Q: 前端看不到「简历优化」菜单？
需要以 teacher 或 admin 角色登录，student 角色暂无此功能。

### Q: SSE 流式响应中断？
检查 Nginx 配置是否关闭了缓冲：`proxy_buffering off`

### Q: Embedding 向量化慢？
本地 BGE-M3 在 CPU 上确实较慢。改用硅基流动 API 即可秒速向量化，且有免费额度。

---

*文档生成时间：2026-04-22 | 版本：v1.3*
# Study AI 手把手部署教程

> 完全免费方案：Oracle Cloud（服务器）+ Cloudflare Pages（前端）

---

## 第一部分：系统架构（先看懂再动手）

### 这个系统由哪些部分组成？

```
你的电脑/服务器上运行的东西：

┌─────────────────────────────────────────────┐
│  Docker 容器组                               │
│                                             │
│  ① aishow-backend（Java后端）:8090           │
│     └─ 处理所有业务逻辑                       │
│                                             │
│  ② aishow-mysql（数据库）:3306               │
│     └─ 存用户、对话、文档等数据                │
│                                             │
│  ③ redis-aishow（缓存）:6379                 │
│     └─ 存登录Session、临时数据                │
│                                             │
│  ④ chroma（向量数据库）:8000                  │
│     └─ 存文档向量，做语义搜索                  │
│                                             │
│  ⑤ aishow-searxng（搜索引擎）:8081           │
│     └─ 联网搜索功能                           │
└─────────────────────────────────────────────┘

外部服务（需要API Key）：

⑥ AI大模型 API（DeepSeek/通义千问等）
   └─ 真正生成回答的模型

⑦ Embedding API（硅基流动，免费）
   └─ 把文字转成向量数字，用于知识库检索

用户看到的界面：

⑧ React 前端
   └─ 部署在 Cloudflare Pages（免费）
   └─ 本地开发时跑在 localhost:5173
```

### 一次问答的完整流程

```
① 用户在网页输入："什么是Spring Boot？"
        ↓
② 前端发送请求到后端 /api/chat/stream
        ↓
③ 后端先检查登录状态（Session）
        ↓
④ 如果开了联网搜索：
   问 SearxNG → 搜百度/Bing → 拿到实时结果
        ↓
⑤ 知识库检索：
   把问题发给 Embedding API → 转成向量
   → 在 ChromaDB 里找最相似的文档片段
        ↓
⑥ 组装 Prompt：
   系统角色 + 知识库内容 + 联网结果 + 用户问题
        ↓
⑦ 发给 DeepSeek AI API
        ↓
⑧ AI 返回答案（逐字流式返回）
        ↓
⑨ 后端通过 SSE 协议推送到前端
        ↓
⑩ 前端实时渲染，用户看到文字一个个出现
```

---

## 第二部分：本地开发环境搭建

> 目标：在你自己电脑上把项目跑起来

### 步骤 1：安装必要软件

**安装 Java 21**（后端运行环境）
```bash
# Mac 用户（推荐用 Homebrew）
brew install openjdk@21

# 验证安装成功
java -version
# 应该显示: openjdk version "21.x.x"
```

**安装 Node.js 20**（前端运行环境）
```bash
# Mac 用户
brew install node@20

# 验证
node -v   # 应显示 v20.x.x
npm -v    # 应显示 10.x.x
```

**安装 Docker Desktop**
- 去 https://www.docker.com/products/docker-desktop/ 下载
- 安装完打开 Docker Desktop，等右下角图标变绿

**安装 Maven**（Java 构建工具）
```bash
brew install maven
mvn -version  # 验证
```

---

### 步骤 2：克隆代码

```bash
# 进入你想放项目的目录
cd ~/Desktop

# 克隆代码（替换为你的实际仓库地址）
git clone https://github.com/SAKURA1175/aishow.git

# 进入项目目录
cd aishow

# 查看项目结构
ls
# 应该看到：
# Dockerfile  docker-compose.yml  frontend/  src/  pom.xml  sql/  ...
```

---

### 步骤 3：获取 AI API Key

**方案A：DeepSeek（推荐，最便宜）**
1. 打开 https://platform.deepseek.com
2. 注册账号（手机号）
3. 点「API Keys」→「创建 API Key」
4. 复制保存（格式：`sk-xxxxxxxxxxxxx`）
5. 充值最低 ¥10（约能用几个月）

**方案B：硅基流动（Embedding 用，有免费额度）**
1. 打开 https://cloud.siliconflow.cn
2. 注册账号
3. 点右上角头像 →「API 密钥」→「新建 API 密钥」
4. 复制保存
5. 免费赠送 ¥14 额度（够用很久）

---

### 步骤 4：配置项目

**配置 AI 参数**（这是最重要的一步）

打开文件 `src/main/resources/redis.properties`：
```bash
# 用你的编辑器打开
open -e src/main/resources/redis.properties
```

修改内容（把 # 注释掉的改成你的实际值）：
```properties
redis.host=localhost
redis.port=6379

# === AI 模型配置 ===
ai.model=deepseek-chat
ai.api.url=https://api.deepseek.com/v1
ai.api.key=sk-你的DeepSeek密钥粘贴在这里

# === Embedding 配置（把文字转向量用）===
ai.embedding.enabled=true
ai.embedding.model=BAAI/bge-m3
ai.embedding.api-url=https://api.siliconflow.cn/v1
ai.embedding.api-key=sk-你的硅基流动密钥粘贴在这里

# === ChromaDB 配置（本地默认）===
ai.chroma.base-url=http://localhost:8000/api/v2
ai.chroma.collection=study_docs
```

---

### 步骤 5：启动 Docker 依赖服务

```bash
# 在项目根目录执行
cd ~/Desktop/aishow

# 启动 MySQL + Redis + ChromaDB + SearxNG
docker-compose up -d

# 等待约30秒，然后验证是否全部启动
docker ps

# 应该看到类似这些容器：
# aishow-mysql       Up
# redis-aishow       Up
# chroma             Up
# aishow-searxng     Up
```

> ⚠️ 如果某个容器没起来，用 `docker logs 容器名` 查看错误

---

### 步骤 6：初始化数据库

```bash
# 等 MySQL 容器完全启动（约10秒）后执行

# 建主要数据表
docker exec -i aishow-mysql mysql -uroot -p1234 study_ai < sql/init.sql

# 建简历优化模块的表
docker exec -i aishow-mysql mysql -uroot -p1234 study_ai < sql/resume_module.sql

# 验证表是否创建成功
docker exec -it aishow-mysql mysql -uroot -p1234 -e "use study_ai; show tables;"
# 应该看到一堆表名
```

---

### 步骤 7：启动后端

```bash
cd ~/Desktop/aishow

# 方式1：开发模式（实时看日志）
mvn spring-boot:run

# 等待看到这行说明启动成功：
# Started StudyAiApplication in X.XXX seconds

# 验证后端运行：
curl http://localhost:8090/actuator/health
# 返回 {"status":"UP"} 说明正常
```

> 💡 第一次启动要下载依赖，可能需要几分钟

---

### 步骤 8：启动前端

**新开一个终端窗口**（不要关闭后端那个）：

```bash
cd ~/Desktop/aishow/frontend

# 安装依赖（第一次需要，之后不用）
npm install

# 启动开发服务器
npm run dev

# 看到这个说明成功：
# VITE v8.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

打开浏览器访问 http://localhost:5173
- 看到登录页面 ✅
- 默认账号：`testteacher` / `123456` / 角色选 Teacher

---

### 步骤 9：初始化知识库（可选但推荐）

```bash
cd ~/Desktop/aishow/kb_data

# 初始化主知识库（计算机技术文章）
python3 scrape_and_import.py

# 初始化简历知识库
python3 resume_kb_init.py

# 等待脚本运行完毕（约3-5分钟）
# 看到 "✅ 全部完成！" 说明成功
```

> 💡 这一步是把知识文章存入向量数据库，让 AI 回答时能参考这些内容

---

## 第三部分：云端部署（Oracle Cloud 免费服务器）

### 为什么选 Oracle Cloud？

Oracle Cloud 有「永久免费」套餐：
- **4核 CPU + 24GB 内存**（ARM 架构）
- 200GB 存储
- 完全免费，不是试用，是真的永久免费
- 对比：腾讯云 2核4G = ¥70/月

### 步骤 1：注册 Oracle Cloud 账号

1. 打开 https://www.oracle.com/cloud/free/
2. 点「Start for free」
3. 填写信息：
   - 账号名：随便取
   - 邮箱：用真实邮箱
   - 地区：**选「Japan East（Tokyo）」** 最近，速度最快
4. 验证邮箱
5. 填写信用卡（用于身份验证，不会扣费）
6. 等待账号激活（可能需要几分钟到几小时）

---

### 步骤 2：创建免费云服务器（VM 实例）

1. 登录 Oracle Cloud 控制台
2. 左上角菜单 → **「Compute」** → **「Instances」**
3. 点「Create Instance」

**配置选项：**
- Name：`aishow-server`（随便取）
- Image：点「Change Image」→ 选 **「Ubuntu 22.04」**
- Shape：点「Change Shape」→
  - Series：选「Ampere」（ARM，免费的）
  - Shape：`VM.Standard.A1.Flex`
  - OCPUs：**4**
  - Memory：**24 GB**
- 网络：默认即可
- SSH Keys：
  - 如果你有 SSH 公钥，粘贴进去
  - 没有的话点「Generate a key pair」，下载私钥保存好

4. 点「Create」，等待2-3分钟创建完成

---

### 步骤 3：开放服务器端口

创建完后，需要开放防火墙端口：

1. 点进刚创建的实例
2. 左侧 「Primary VNIC」→「Subnet」→ 点进去
3. 「Security Lists」→ 点进 Default Security List
4. 点「Add Ingress Rules」，添加以下规则：

| Source CIDR | Protocol | Port | 用途 |
|---|---|---|---|
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |
| 0.0.0.0/0 | TCP | 8090 | 后端API（临时）|

5. 保存

**还要在服务器内部开放端口**（SSH 进去后执行）：
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8090 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

---

### 步骤 4：SSH 连接到服务器

```bash
# 找到你的服务器公网IP（在实例详情页「Public IP address」）
# 假设是 140.238.xxx.xxx

# Mac/Linux 连接
ssh -i ~/Downloads/你下载的私钥文件.key ubuntu@140.238.xxx.xxx

# 第一次连接会问「Are you sure」，输入 yes 回车
```

---

### 步骤 5：服务器基础环境安装

**SSH 连接进去后执行以下命令：**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 把当前用户加入 docker 组（这样不需要每次都 sudo）
sudo usermod -aG docker $USER

# 重新加载组权限（重要！）
newgrp docker

# 验证 Docker 安装成功
docker run hello-world
# 看到 "Hello from Docker!" 说明成功

# 安装 docker-compose（如果没有）
sudo apt install docker-compose-plugin -y

# 安装 git
sudo apt install git -y
```

---

### 步骤 6：部署应用到服务器

```bash
# 在服务器上克隆代码
git clone https://github.com/SAKURA1175/aishow.git
cd aishow

# 创建配置文件（复制示例）
cp .env.example .env   # 如果有的话
# 或者直接创建
nano .env
```

**`.env` 文件内容**（nano 编辑器里粘贴）：
```bash
# AI 模型（换成你的 DeepSeek Key）
AISHOW_AI_MODEL=deepseek-chat
AISHOW_AI_API_URL=https://api.deepseek.com/v1
AISHOW_AI_API_KEY=sk-你的DeepSeek密钥

# Embedding（硅基流动）
AISHOW_AI_EMBEDDING_MODEL=BAAI/bge-m3
AISHOW_AI_EMBEDDING_API_URL=https://api.siliconflow.cn/v1
AISHOW_AI_EMBEDDING_API_KEY=sk-你的硅基流动密钥

# 数据库（改个强密码）
AISHOW_JDBC_URL=jdbc:mysql://aishow-mysql:3306/study_ai?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
AISHOW_JDBC_USERNAME=root
AISHOW_JDBC_PASSWORD=MyStr0ngP@ssw0rd

# Redis（容器内部）
AISHOW_REDIS_HOST=redis-aishow
AISHOW_REDIS_PORT=6379

# ChromaDB（容器内部，不用改）
AISHOW_AI_CHROMA_BASE_URL=http://chroma:8000/api/v2
```

保存：`Ctrl+X` → `Y` → 回车

---

### 步骤 7：构建并启动应用

```bash
cd ~/aishow

# 先构建前端（把 React 打包成静态文件）
# 注意：需要先修改前端 API 地址
# 编辑 frontend/vite.config.js，把 proxy target 改成 http://localhost:8090

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
node -v  # 验证

# 构建前端
cd frontend && npm install && npm run build
cd ..

# 启动所有后端服务
docker-compose --env-file .env up -d

# 查看启动状态（等待约30-60秒）
docker ps

# 等后端完全起来
sleep 30

# 初始化数据库
MYSQL_PWD=$(grep AISHOW_JDBC_PASSWORD .env | cut -d= -f2)
docker exec -i aishow-mysql mysql -uroot -p${MYSQL_PWD} study_ai < sql/init.sql
docker exec -i aishow-mysql mysql -uroot -p${MYSQL_PWD} study_ai < sql/resume_module.sql

# 验证后端正常
curl http://localhost:8090/actuator/health
```

---

### 步骤 8：安装 Nginx（Web 服务器）

Nginx 负责：
- 把用户访问 80 端口的请求转发给后端 8090
- 同时提供前端静态文件

```bash
# 安装 Nginx
sudo apt install nginx -y

# 复制前端构建产物到 Nginx 目录
sudo cp -r ~/aishow/frontend/dist/* /var/www/html/

# 配置 Nginx
sudo nano /etc/nginx/sites-available/aishow
```

**粘贴以下配置**：
```nginx
server {
    listen 80;
    server_name _;   # 填你的IP或域名，没域名就写 _

    # 前端静态文件
    root /var/www/html;
    index index.html;

    # 所有路由都返回 index.html（React 单页应用必须这样）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8090/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # SSE 流式推送必须设置这几个！
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        chunked_transfer_encoding on;
    }
}
```

保存（`Ctrl+X` → `Y` → 回车），然后：
```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/aishow /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # 删除默认配置

# 测试配置是否有语法错误
sudo nginx -t
# 显示 "syntax is ok" 才继续

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx  # 设置开机自启
```

---

### 步骤 9：验证部署

```bash
# 在服务器上测试
curl http://localhost/         # 应该返回 HTML
curl http://localhost/api/actuator/health  # 应该返回 {"status":"UP"}
```

用浏览器访问：`http://你的服务器公网IP`

✅ 看到 Study AI 登录页面，说明部署成功！

---

## 第四部分：前端部署到 Cloudflare Pages（可选优化）

> 作用：让前端走 Cloudflare 全球 CDN，速度更快，并且可以用自定义域名

### 步骤 1：注册 Cloudflare

1. 打开 https://cloudflare.com
2. 点「Sign up」注册（免费，无需信用卡）
3. 验证邮箱

### 步骤 2：修改前端 API 地址

前端需要知道后端在哪里。编辑 `frontend/vite.config.js`：

找到 proxy 配置，把 target 改成你的服务器 IP：
```js
proxy: {
  '/api': {
    target: 'http://你的Oracle服务器IP:8090',
    changeOrigin: true,
  }
}
```

> 💡 如果用 Cloudflare Pages，构建时 vite proxy 不起作用。需要设置环境变量 `VITE_API_BASE_URL=http://你的服务器IP:8090`

### 步骤 3：在 Cloudflare Pages 创建项目

1. 登录 Cloudflare → 左侧「Workers & Pages」
2. 点「Create」→「Pages」→「Connect to Git」
3. 连接 GitHub 账号，选择 `aishow` 仓库
4. 配置构建：
   - **Build command**：`cd frontend && npm install && npm run build`
   - **Build output directory**：`frontend/dist`
5. 环境变量（点「Environment variables」添加）：
   ```
   NODE_VERSION = 20
   ```
6. 点「Save and Deploy」
7. 等待构建完成（约2分钟）

部署完成后，Cloudflare 会给你一个免费域名，格式：
`aishow-xxx.pages.dev`

---

## 第五部分：常见报错解决

### 报错：`No route to host` 或 `Connection refused`
```bash
# 原因：端口没开或防火墙拦截
# 解决：
sudo ufw allow 8090
# 同时检查 Oracle Cloud 安全组是否开放了端口
```

### 报错：`ChromaDB connection failed`
```bash
# 查看 ChromaDB 容器状态
docker logs chroma
# 重启
docker restart chroma
# 验证
curl http://localhost:8000/api/v2/heartbeat
```

### 报错：`Embedding API failed`
```bash
# 原因：硅基流动 Key 不对或余额不足
# 检查 redis.properties 里的 ai.embedding.api-key 是否正确
# 系统会自动降级（跳过向量检索），不影响基本对话功能
```

### 报错：`Cannot find module` 前端报错
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 容器启动后 30 秒内健康检查失败
```bash
# 查看具体错误
docker logs aishow-backend --tail 50

# 常见原因：数据库还没就绪
# 等再多 30 秒重试
curl http://localhost:8090/actuator/health
```

### SSE 流式响应不工作（AI 回答一次性显示而不是逐字）
```bash
# 检查 Nginx 配置是否有 proxy_buffering off
sudo cat /etc/nginx/sites-available/aishow | grep buffering
# 必须有：proxy_buffering off;
```

---

## 第六部分：日常维护命令

```bash
# 查看所有服务状态
docker ps

# 查看后端日志（实时）
docker logs aishow-backend -f

# 重启后端
docker restart aishow-backend

# 更新代码后重新部署
cd ~/aishow
git pull
mvn package -DskipTests
docker cp target/*.jar aishow-backend:/app/app.jar
docker restart aishow-backend

# 备份数据库
docker exec aishow-mysql mysqldump -uroot -pYourPassword study_ai > backup_$(date +%Y%m%d).sql

# 查看磁盘使用
df -h
docker system df
```

---

## 第七部分：API Key 申请完整截图指引

### DeepSeek API Key 申请

1. 浏览器打开：`https://platform.deepseek.com`
2. 右上角「注册」→ 填手机号 → 获取验证码 → 注册
3. 登录后点左侧「API Keys」
4. 点「+ 创建 API Key」
5. Name 随便填，点「确认」
6. **立即复制**（只显示一次！）保存到记事本
7. 左侧「充值」→ 微信支付 ¥10（最低）

### 硅基流动 API Key 申请

1. 浏览器打开：`https://cloud.siliconflow.cn`
2. 右上角「注册」→ 邮箱注册
3. 登录后点右上角头像 → 「API密钥」
4. 点「新建API密钥」
5. 复制保存
6. 注册即送 ¥14 免费额度，够用很久

---

## 附录：完整配置文件模板

### `redis.properties`（本地开发版）

```properties
redis.host=localhost
redis.port=6379

ai.model=deepseek-chat
ai.api.url=https://api.deepseek.com/v1
ai.api.key=sk-你的DeepSeek密钥

ai.embedding.enabled=true
ai.embedding.model=BAAI/bge-m3
ai.embedding.api-url=https://api.siliconflow.cn/v1
ai.embedding.api-key=sk-你的硅基流动密钥
ai.embedding.connect-timeout-ms=5000
ai.embedding.read-timeout-ms=30000

ai.chroma.base-url=http://localhost:8000/api/v2
ai.chroma.tenant=default_tenant
ai.chroma.database=default_database
ai.chroma.collection=study_docs

ai.rag.retrieval-top-k=4
ai.rag.max-prompt-chars=1400
ai.rag.max-history-messages=20
ai.api.connect-timeout-ms=5000
ai.api.read-timeout-ms=120000
```

### `.env`（服务器生产版）

```bash
AISHOW_AI_MODEL=deepseek-chat
AISHOW_AI_API_URL=https://api.deepseek.com/v1
AISHOW_AI_API_KEY=sk-你的DeepSeek密钥

AISHOW_AI_EMBEDDING_MODEL=BAAI/bge-m3
AISHOW_AI_EMBEDDING_API_URL=https://api.siliconflow.cn/v1
AISHOW_AI_EMBEDDING_API_KEY=sk-你的硅基流动密钥

AISHOW_JDBC_URL=jdbc:mysql://aishow-mysql:3306/study_ai?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
AISHOW_JDBC_USERNAME=root
AISHOW_JDBC_PASSWORD=换一个强密码

AISHOW_REDIS_HOST=redis-aishow
AISHOW_REDIS_PORT=6379

AISHOW_AI_CHROMA_BASE_URL=http://chroma:8000/api/v2
AISHOW_BACKEND_PORT=8090
AISHOW_SEARXNG_PORT=8081
```

---

*文档版本：v2.0 手把手版 | 2026-04-22*
