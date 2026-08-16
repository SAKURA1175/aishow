<div align="center">

<br/>

<img src="https://img.shields.io/badge/Study_AI-🎓-4F46E5?style=flat-square" height="40" alt="Study AI Logo" />

# 🎓 Study AI · 自托管智能学业辅助平台
### Open-Source AI Study Assistant & RAG Knowledge Base

**自托管数据私有 · 本地大模型/云端API · RAG知识库 · SearXNG隐私联网 · 深度思考可视化 · KaTeX公式渲染**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-4F46E5?style=for-the-badge)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17+-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[![Stars](https://img.shields.io/github/stars/SAKURA1175/aishow?style=social)](https://github.com/SAKURA1175/aishow)
[![Forks](https://img.shields.io/github/forks/SAKURA1175/aishow?style=social)](https://github.com/SAKURA1175/aishow)

<br/>

> **一行命令在局域网/服务器一键部署专属于你的 AI 学业导师与智能知识库系统。**  
> 零数据泄漏风险，支持本地大模型（LM Studio / Ollama）与云端 OpenAI / DeepSeek / Qwen 等兼容 API。

<br/>

[📖 中文说明](#-中文说明) · [✨ 核心特色](#-核心特色) · [📸 页面截图展示](#-各种功能截图与架构图) · [🚀 快速部署](#-快速部署指南) · [🗄️ 数据库 SQL](#-数据库建表与初始化) · [🏗️ 技术架构](#-技术架构)

</div>

---

<a name="中文说明"></a>

## 📖 项目简介

**Study AI** 是一款基于 **Spring Boot 3 + Spring AI + React 18** 构建的自托管智能学业辅助与 RAG 知识库平台。

不同于通用型的对话聊天工具，**Study AI** 专门面向高校教学、学科辅导与个人知识库检索场景进行深度定制：
- 针对数学、物理、计算机等学科，内置 **KaTeX 实时渲染** 与 **`<think>` 推理思考链可视化**；
- 集成 **BGE-M3 向量切片** 与 **ChromaDB 向量数据库**，支持上传 PDF / Word / TXT 课件自动做语义 RAG 检索并附带**可追溯引用源卡片**；
- 搭载 **SearXNG 自托管搜索引擎**，支持一键开/关隐私联网检索；
- 提供**管理员热更新面板**，无需重启服务即可在线切换模型、调优 System Prompt 和上下文长度。

---

## ✨ 核心特色

### 🆚 对比通用 AI 对话软件

| 功能特性 | 🎓 Study AI | ChatGPT-Next-Web | LobeChat |
|---|:---:|:---:|:---:|
| **自托管 RAG 知识库 (PDF/Word)** | ✅ | ❌ | ⚠️ |
| **自托管 SearXNG 隐私联网** | ✅ | ❌ | ⚠️ |
| **深度思考推理链可视化 (`<think>`)** | ✅ | ❌ | ❌ |
| **KaTeX 数学公式 & 代码块高亮** | ✅ | ❌ | ❌ |
| **管理后台（模型/提示词/上下文热更新）** | ✅ | ❌ | ⚠️ |
| **自动会话标题生成** | ✅ | ✅ | ✅ |
| **多模态图文解析 (Vision)** | ✅ | ✅ | ✅ |
| **一键 Docker Compose 容器化部署** | ✅ | ✅ | ⚠️ |
| **100% 数据隐私与本地大模型支持** | ✅ | ❌ | ⚠️ |

---

### 💡 核心功能拆解

1. **🧠 深度思考推理链可视化**
   - 实时解析大模型输出的 `<think>` 标签或 Gemma `reasoning_content` 推理 token。
   - 前端支持可折叠展开的推理思维链面板，帮助学生直观查看 AI 解题与推导过程。

2. **📚 RAG 智能知识库检索**
   - 支持上传 PDF、Word (.docx)、TXT 等教学课件与参考资料。
   - 后端自动分块、生成向量（基于 BGE-M3 或 OpenAI Embedding），并存入 ChromaDB 向量库。
   - 提问时自动匹配最高相关度段落注入 AI 上下文，回答底部生成可点击的引用段落卡片。

3. **🌐 隐私联网搜索 (SearXNG 集成)**
   - 独立开关控制每条消息是否启用联网。
   - 依托局域网自托管 SearXNG 引擎，不向第三方泄露搜索记录与隐私，提问自动附带网页参考来源。

4. **📐 LaTeX / KaTeX 数学公式渲染**
   - 完美渲染行内公式 `$E=mc^2$` 与块级公式 `$$\int_{0}^{\infty} f(x) dx$$`。
   - 彻底解决理工科学科解答中的公式乱码问题。

5. **🖼️ 多模态视觉图文分析**
   - 支持拖拽上传题目图片、图表或代码截图。
   - 兼容 GPT-4o、LLaVA、Gemma Vision 等多模态视觉模型。

6. **🛠️ 管理后台热更新**
   - **模型热切换**：随时更改 API URL、API Key 与 Model 名称。
   - **System Prompt 在线编辑**：实时更新学生端与教师端的角色提示词。
   - **上下文调控**：灵活设置携带历史消息条数与字符数上限。

---

<a name="各种功能截图与架构图"></a>

## 📸 各种功能截图与架构图

### 1. 🔑 统一登录与身份认证
系统支持学生、教师与系统管理员多角色登录与安全鉴权拦截。

![登录/注册界面](docs/screenshots/01-login.png)

---

### 2. 📊 学生工作台 & 平台首页
提供简洁直观的学业导航入口、最近会话列表以及热点学科推荐。

![学生工作台](docs/screenshots/02-dashboard.png)

---

### 3. 💬 智能学业问答（流式响应 & 深度思考 & 公式渲染）
支持 SSE 逐 Token 流式输出、`<think>` 推理思考链折叠展示以及 KaTeX 完美公式渲染。

![智能学业问答](docs/screenshots/03-chat-ai.png)

---

### 4. 👨‍🏫 教师 / 学业指导对话模式
特定专业方向的导师角色问答，提供精准的学术写作建议与课程指导。

![教师指导对话](docs/screenshots/04-chat-teacher.png)

---

### 5. 📚 知识库管理与 RAG 文档切片
教师与管理员可上传教学大纲、PDF 课件，系统自动完成向量切片入库与状态监控。

![知识库管理](docs/screenshots/05-documents-rag.png)

---

### 6. 📝 学习任务与作业批改
支持学业任务管理、课程作业提交以及 AI 自动预批注功能。

![作业与任务](docs/screenshots/06-assignments.png)

---

### 7. 🛠️ 系统管理后台（模型 & Prompt 热更新）
在线调整 LLM 接口配置、模型名称、系统角色 Prompt 与向量库连接状态。

![系统管理后台](docs/screenshots/07-admin-panel.png)

---

### 8. 🌳 系统总体功能结构图
清晰呈现用户管理、智能对话、知识库 RAG、学习画像与系统管理五大模块架构。

![系统功能结构图](docs/screenshots/08-function-tree.png)

---

### 9. 🗄️ 数据库概念 E-R 图
展示用户 (`user`)、会话 (`chat_session`)、消息 (`chat_message`)、文档 (`document`) 及切片 (`document_chunk`) 的完整数据实体关系。

![数据库 E-R 图](docs/screenshots/09-er-diagram.png)

---

### 10. ⏱️ 核心业务交互时序图

#### (1) SSE 流式问答交互时序图
![SSE 流式问答时序图](docs/screenshots/10-chat-sequence.png)

#### (2) RAG 知识库检索与切片入库时序图
![RAG 检索时序图](docs/screenshots/11-rag-sequence.png)

---

### 11. 👤 系统角色用例图

| 学生用例图 | 管理员与教师用例图 |
|---|---|
| ![学生用例图](docs/screenshots/12-usecase-student.png) | ![管理员与教师用例图](docs/screenshots/13-usecase-admin-teacher.png) |

---

<a name="技术架构"></a>

## 🏗️ 技术架构与选型

```
┌─────────────────────────────────────────────────────────┐
│                   浏览器客户端 (React 18)                 │
│   Chat UI · Admin Panel · Markdown · KaTeX · SSE Client │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / SSE
┌───────────────────────▼─────────────────────────────────┐
│              Spring Boot 3.3 后端核心                    │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │ ChatController│ │AdminCtrl │  │  RAG Pipeline       │ │
│  │  SSE Stream  │ │Hot-reload│  │  chunk→embed→search  │ │
│  └──────┬───────┘ └──────────┘  └──────────┬──────────┘ │
│         │                                   │            │
│  ┌──────▼───────────────────────────────────▼──────────┐ │
│  │           Spring AI (OpenAI-compatible)              │ │
│  └──────────────────────────┬───────────────────────────┘ │
└─────────────────────────────┼───────────────────────────┘
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        本地/云端 LLM       ChromaDB         SearXNG
    (LM Studio/Ollama)  (Vector Store)  (Web Search)
```

| 图层 | 技术组件 | 描述/作用 |
|---|---|---|
| **前端界面** | React 18, Vite, Tailwind CSS, Zustand, KaTeX, Lucide Icons | 响应式现代化双栏 UI、SSE 极速渲染、公式高亮 |
| **后端框架** | Spring Boot 3.3.0, Spring WebFlux (SseEmitter) | 高并发长连接推送、RESTful 接口 |
| **AI 框架** | Spring AI, HttpClient | 统一抽象 OpenAI / DeepSeek / LM Studio 接口 |
| **关系型数据库** | MySQL 8.0, MyBatis | 会话历史、用户鉴权、文档元数据存储 |
| **向量数据库** | ChromaDB (REST API) | 高维向量存盘与 Top-K 语义近邻检索 |
| **高速缓存** | Redis 7.0 | Token / Cookie 鉴权缓存、临时会话锁 |
| **隐私搜索引擎** | SearXNG | 本地自托管搜索，无隐私泄露风险 |
| **容器化运维** | Docker, Docker Compose | 多阶段构建、一键极速打包部署 |

---

<a name="快速部署指南"></a>

## 🚀 快速部署指南

### 前置条件

- **Docker & Docker Compose** (推荐)
- **MySQL 8.0+** & **Redis 6+**
- **LLM 服务端**（本地 LM Studio / Ollama 或云端 DeepSeek / OpenAI API）
- **ChromaDB**（RAG 功能可选）

---

### 第一步：克隆仓库并配置环境变量

```bash
git clone https://github.com/SAKURA1175/aishow.git
cd aishow

# 复制配置文件模板
cp .env.example .env
```

修改 `.env` 配置文件中的核心参数：

```env
# MySQL 数据库配置
AISHOW_JDBC_URL=jdbc:mysql://host.docker.internal:3306/study_ai?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
AISHOW_JDBC_USERNAME=root
AISHOW_JDBC_PASSWORD=your_mysql_password

# Redis 配置
AISHOW_REDIS_HOST=host.docker.internal
AISHOW_REDIS_PORT=6379

# 大模型 Endpoint (本地 LM Studio 示例)
AISHOW_AI_API_URL=http://host.docker.internal:1234
AISHOW_AI_MODEL=gemma-4-e4b-it
AISHOW_AI_API_KEY=lm-studio

# 若使用 DeepSeek / 云端 API:
# AISHOW_AI_API_URL=https://api.deepseek.com/v1
# AISHOW_AI_MODEL=deepseek-chat
# AISHOW_AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 第二步：一键构建并启动 (Docker Compose)

```bash
docker-compose up -d --build
```

容器启动完成后，访问 **http://localhost:8090** 即可进入系统！

- **默认管理员账号**：`admin`
- **默认管理员密码**：`admin123` *(请在首次登录后于管理后台修改密码)*

---

### 🛠️ 本地开发运行模式

#### 1. 后端 (Spring Boot)
```bash
# 执行 Maven 打包与运行
mvn clean package -DskipTests
java -jar target/study-ai-backend.jar
```

#### 2. 前端 (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

前端开发服务器将运行在 **http://localhost:5173**，自动代理 `/api` 请求至 `8090` 后端端口。

---

<a name="数据库建表与初始化"></a>

## 🗄️ 数据库建表与初始化

系统会自动连接 MySQL。如需手动建表，请在 MySQL 数据库 `study_ai` 中运行如下 SQL 脚本：

```sql
CREATE DATABASE IF NOT EXISTS `study_ai` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `study_ai`;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(16) NOT NULL DEFAULT 'student',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 对话会话表
CREATE TABLE IF NOT EXISTS `chat_session` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(100) DEFAULT '新的对话',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 对话消息表
CREATE TABLE IF NOT EXISTS `chat_message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` bigint NOT NULL,
  `role` varchar(16) NOT NULL,
  `content` longtext NOT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 教学文档元数据表
CREATE TABLE IF NOT EXISTS `document` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content` longtext,
  `upload_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 文档向量切片表
CREATE TABLE IF NOT EXISTS `document_chunk` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `document_id` bigint NOT NULL,
  `content` text NOT NULL,
  `chunk_index` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_document_id` (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 向量映射索引表
CREATE TABLE IF NOT EXISTS `document_embedding` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `chunk_id` bigint NOT NULL,
  `document_id` bigint NOT NULL,
  `chroma_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_chunk_id` (`chunk_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 学习画像表
CREATE TABLE IF NOT EXISTS `learning_profile` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `profile_data` longtext,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. 问题日志表
CREATE TABLE IF NOT EXISTS `user_question_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `question` text,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认管理员 (admin / admin123)
INSERT IGNORE INTO `user` (`username`, `password`, `role`)
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTyRQW9e6K', 'admin');
```

---

## 📁 项目目录结构说明

```
aishow/
├── docs/                         # 系统文档与截图资源
│   └── screenshots/              # 功能截图 (01-login ~ 13-usecase)
├── src/                          # Spring Boot 核心后端
│   └── main/
│       ├── java/com/xxzd/study/
│       │   ├── ai/               # AI 连接器与 Spring AI 封装
│       │   ├── controller/       # REST API & SSE 控制器
│       │   ├── service/          # RAG、搜索、会话核心业务逻辑
│       │   ├── mapper/           # MyBatis Mapper 接口与 SQL
│       │   └── config/           # AI 参数配置类 (AiProperties)
│       └── resources/
│           ├── mappers/          # DocumentMapper.xml 等 MyBatis 映射
│           └── schema.sql        # 数据库初始化 SQL
├── frontend/                     # React 18 + Vite 前端工程
│   └── src/
│       ├── pages/                # 页面 (Login, Chat, Admin, Dashboard)
│       ├── components/           # 核心组件 (Markdown, Math, Thinking)
│       └── api/                  # Axios 与 SSE 请求封装
├── ops/                          # 运维组件 (SearXNG 等配置)
├── docker-compose.yml            # Docker 容器化编排文件
├── Dockerfile                    # 前后端合并多阶段镜像构建
├── .env.example                  # 环境变量配置模板
└── README.md                     # 项目详细说明文档
```

---

## 🗺️ 路线图 (Roadmap)

- [x] SSE 低延迟 Token 流式响应
- [x] Markdown 实时解析 & KaTeX 数学公式渲染
- [x] 深度思考 `<think>` 链解析与折叠控制
- [x] BGE-M3 + ChromaDB RAG 向量知识库
- [x] SearXNG 自托管隐私联网搜索
- [x] 系统管理后台热更新配置
- [x] 统一 Docker / Docker Compose 部署方案
- [ ] Flyway 数据库自动版本迁移
- [ ] 导出对话为 PDF / Markdown 文件
- [ ] 智能作业 AI 预批注模式
- [ ] 语音输入与声音合成 (TTS) 支持

---

## 🤝 贡献与支持

欢迎提交 Issue 和 Pull Request！如果你觉得 **Study AI** 对你的学习或工作有所帮助，请为本项目点亮一颗 ⭐ **Star**！

[![Star History Chart](https://api.star-history.com/svg?repos=SAKURA1175/aishow&type=Date)](https://star-history.com/#SAKURA1175/aishow&Date)

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源发布。
