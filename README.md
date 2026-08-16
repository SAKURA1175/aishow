<div align="center">

<br/>

<img src="https://img.shields.io/badge/Study_AI-🎓-4F46E5?style=flat-square" height="42" alt="Study AI Logo" />

# 🎓 Study AI · 自托管全场景智能学业辅助与 RAG 知识库系统
### Enterprise-Grade Open-Source AI Study Assistant, RAG Knowledge Base & Learning Management Platform

**全功能自托管 · 100% 数据私有 · 本地大模型/云端API · RAG双路检索 · SearXNG隐私联网 · 深度思考可视化 · KaTeX公式渲染 · 知识星图 · 智能批改 · 简历学流推荐**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-4F46E5?style=for-the-badge)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17+-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

[![Stars](https://img.shields.io/github/stars/SAKURA1175/aishow?style=social)](https://github.com/SAKURA1175/aishow)
[![Forks](https://img.shields.io/github/forks/SAKURA1175/aishow?style=social)](https://github.com/SAKURA1175/aishow)

<br/>

> 🚀 **专为高校教学、个人学业辅导与科研知识检索打造的一站式开源 AI 解决方案。**  
> 零数据泄露风险，支持本地大模型（LM Studio / Ollama / LocalAI）与云端主流 API（DeepSeek / OpenAI / Qwen / Claude）。

<br/>

[📖 平台概述](#-平台概述) · [✨ 18大核心功能](#-18大核心功能全景拆解) · [📸 18大具体页面真实截图](#-18大具体页面真实截图展示) · [🚀 快速部署](#-快速部署指南) · [🗄️ 数据库 SQL](#-完整数据库建表-sql) · [🔌 API 总结](#-核心-api-接口总结)

</div>

---

<a name="平台概述"></a>

## 📖 平台概述 (System Overview)

**Study AI** 是一款基于 **Spring Boot 3.3 + Spring AI + React 18 + Vite** 开发的企业级、自托管智能学业辅助与 RAG 知识库系统。

系统针对真实教育与学习场景进行深度开发，包含 **18 个完全独立且高度协同的页面功能模块**。无论是学生自主答疑、查看能力分布、做题复习，还是教师发布作业、批改试卷、管理班级知识库，亦或是系统管理员在线调整底层大模型参数，均提供了完整、美观的响应式 UI 界面。

---

<a name="18大具体页面真实截图展示"></a>

## 📸 18大具体页面真实截图展示 (All 18 Real Page Screenshots)

以下是在真实运行环境中（`http://localhost:5174`）截取的所有 18 个核心功能页面的高分辨率真实界面：

### 1. 🔑 统一登录与身份认证 (`/login`)
系统提供安全优雅的统一登录/注册入口，支持学生、教师与系统管理员多角色快速切换，内置动画互动与 DEMO 演示账号快速填入。

![01-login.png](docs/screenshots/01-login.png)

---

### 2. 📊 学生工作台 & 平台主页 (`/dashboard`)
包含学业导航入口、最近会话记录、热点推荐主题以及快捷 AI 问答唤起卡片。

![02-dashboard.png](docs/screenshots/02-dashboard.png)

---

### 3. 💬 智能学业问答与 SSE 流式对话 (`/chat`)
双栏 Chat 交互界面，实时显示 SSE 逐 Token 流式输出、`<think>` 折叠思考链、KaTeX 数学公式渲染、自托管联网搜索切换及知识库引用卡片。

![03-chat-ai.png](docs/screenshots/03-chat-ai.png)

---

### 4. 📚 知识库管理与 RAG 文档切片 (`/documents`)
支持上传 PDF / Word / TXT 教学课件，可视化展示全自动切片向量化入库进度、切片段落明细与 ChromaDB 存储状态。

![04-documents-rag.png](docs/screenshots/04-documents-rag.png)

---

### 5. 🧠 学习画像与学情能力诊断 (`/profile`)
基于提问日志自动分类统计，直观分析学生在各学科板块的提问频次、掌握度得分与弱项复习建议。

![05-profile.png](docs/screenshots/05-profile.png)

---

### 6. 🌌 知识星图与 D3 拓扑分析 (`/starmap`)
前端采用 D3.js 渲染互动式知识拓扑星图，直观展现学科知识点之间的层级递进与关联逻辑。

![06-starmap.png](docs/screenshots/06-starmap.png)

---

### 7. 🕒 历史对话管理与归档 (`/history`)
管理学生的历史提问会话，支持按标题搜索、会话导出（Markdown/JSON）、重命名与批量清理。

![07-history.png](docs/screenshots/07-history.png)

---

### 8. 📄 简历匹配与学习流引擎 (`/resume`)
上传个人简历文本，智能分析当前技能栈与目标岗位的差距 (Gap)，量化生成阶梯式学习路径与补短板建议。

![08-resume.png](docs/screenshots/08-resume.png)

---

### 9. 🏫 班级与课程管理 (`/classes`)
教师创建班级生成专属邀请码，管理班级学生名单并绑定班级专有的教学大纲与参考课件库。

![09-classes.png](docs/screenshots/09-classes.png)

---

### 10. 📝 作业管理与 AI 智能预批改 (`/assignments`)
教师发布课程作业，学生在线提交答案与附件，AI 自动完成语法纠错、逻辑点评与预打分。

![10-assignments.png](docs/screenshots/10-assignments.png)

---

### 11. 📈 成绩分析与分布图表 (`/grades`)
可视化展示学生历次考试与作业成绩的分数变化曲线、班级最高分/平均分对比及分数段直方图。

![11-grades.png](docs/screenshots/11-grades.png)

---

### 12. ✍️ 在线测试与考试引擎 (`/exams`)
支持单选、多选、填空及简答题，提供在线倒计时答题、自动交卷判分以及 AI 逐题解析。

![12-exams.png](docs/screenshots/12-exams.png)

---

### 13. 📖 错题本管理与诊断解析 (`/wrong-questions`)
自动归纳答错题目，AI 生成错题原因诊断与解题突破口提示，支持定期复习打卡。

![13-wrong-questions.png](docs/screenshots/13-wrong-questions.png)

---

### 14. 📓 智能学业笔记本 (`/notes`)
支持 Markdown 富文本笔记编辑，可将对话中的优质 AI 学情解答一键整理转存为结构化笔记。

![14-notes.png](docs/screenshots/14-notes.png)

---

### 15. 📅 待办事项与日程规划 (`/schedule`)
管理每日学习待办 (`Todo`)、考试/大作业倒计时提醒，按优先级分类追踪学习进度。

![15-schedule.png](docs/screenshots/15-schedule.png)

---

### 16. 🏅 每日学习打卡与热力图 (`/checkin`)
记录学生每日学习时长与提问打卡情况，呈现 GitHub 风格的学习热力图与连续打卡勋章。

![16-checkin.png](docs/screenshots/16-checkin.png)

---

### 17. 💬 师生问答社区与论坛 (`/forum`)
提供学生发帖提问、师生交流讨论的学术社区，支持一键召唤 AI 助手提供参考回帖。

![17-forum.png](docs/screenshots/17-forum.png)

---

### 18. 🛠️ 系统管理后台与热更新设置 (`/admin`)
系统管理员控制台，支持无缝热切换 LLM API Endpoint、修改角色 Prompt、调优上下文记忆参数及监控服务器健康状态。

![18-admin-panel.png](docs/screenshots/18-admin-panel.png)

---

### 📐 UML 系统设计架构图展示

| 系统总体功能结构图 | 数据库 E-R 概念图 |
|---|---|
| ![08-function-tree.png](docs/screenshots/08-function-tree.png) | ![09-er-diagram.png](docs/screenshots/09-er-diagram.png) |

| SSE 流式问答交互时序图 | RAG 检索与切片入库时序图 |
|---|---|
| ![10-chat-sequence.png](docs/screenshots/10-chat-sequence.png) | ![11-rag-sequence.png](docs/screenshots/11-rag-sequence.png) |

---

<a name="18大核心功能全景拆解"></a>

## ✨ 18大核心功能全景拆解

### 🆚 竞品与通用 AI 软件全方位对比

| 功能维度 | 🎓 **Study AI** | ChatGPT-Next-Web | LobeChat | FastGPT / Dify |
|---|:---:|:---:|:---:|:---:|
| **全场景 18 大教育页面** | **原生深度定制** | 仅对话界面 | 仅对话界面 | 侧重工作流构建 |
| **自托管 RAG 知识库 (PDF/Word/TXT)** | ✅ **支持 (BGE-M3 + ChromaDB)** | ❌ 不支持 | ⚠️ 部分支持 | ✅ 支持 |
| **RAG 降级容灾机制 (MySQL LIKE)** | ✅ **自动降级容灾** | ❌ 无 | ❌ 无 | ❌ 无 |
| **自托管 SearXNG 隐私联网搜索** | ✅ **支持 (卡片精准渲染)** | ❌ 不支持 | ⚠️ 需要云端插件 | ⚠️ 需要复杂配置 |
| **深度思考推理链可视化 (`<think>`)** | ✅ **原生折叠面板渲染** | ❌ 不支持 | ❌ 不支持 | ⚠️ 需要自定义卡片 |
| **LaTeX / KaTeX 数学公式渲染** | ✅ **完美渲染 (行内/块级)** | ⚠️ 基础渲染 | ⚠️ 基础渲染 | ⚠️ 基础渲染 |
| **知识星图与学情画像 (`StarMap`)** | ✅ **D3 交互式树图分析** | ❌ 无 | ❌ 无 | ❌ 无 |
| **智能作业发布与 AI 自动批改** | ✅ **内置支持** | ❌ 无 | ❌ 无 | ❌ 无 |
| **在线测试与智能错题本 (`Exams`)** | ✅ **自动诊断与复习** | ❌ 无 | ❌ 无 | ❌ 无 |
| **简历分析与个人学习流引擎 (`LearningFlow`)**| ✅ **能力缺口推荐** | ❌ 无 | ❌ 无 | ❌ 无 |
| **管理后台配置热更新 (无需重启)** | ✅ **完全支持** | ❌ 无 | ⚠️ 依赖环境变量 | ⚠️ 依赖环境变量 |
| **完全自托管与 100% 数据隐私** | ✅ **零数据外流** | ⚠️ 部分支持 | ⚠️ 部分支持 | ⚠️ 依赖部署规模 |

---

<a name="技术架构与选型"></a>

## 🏗️ 技术架构与选型 (Architecture & Tech Stack)

### 系统分层拓扑架构图

```
┌───────────────────────────────────────────────────────────────────────────┐
│                       React 18 前端交互层 (SPA)                            │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Chat UI    │  │ Admin Panel │  │ StarMap (D3) │  │ Assignments/Ex │  │
│  │ SSE Renderer │  │ Hot-Reload  │  │ Profile Tree │  │  Grade Analytics│ │
│  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
└─────────┼─────────────────┼────────────────┼──────────────────┼───────────┘
          │ SSE Stream      │ HTTP REST      │ HTTP REST        │ HTTP REST
┌─────────▼─────────────────▼────────────────▼──────────────────▼───────────┐
│                      Spring Boot 3.3 后端核心层                           │
│  ┌───────────────────┐ ┌───────────────────┐ ┌─────────────────────────┐ │
│  │  ChatController   │ │  AdminController  │ │ Document/RagController  │ │
│  │ SseEmitter Stream │ │ Hot-Reload Config │ │ Chunk/Embedding Pipeline│ │
│  └────────┬──────────┘ └─────────┬─────────┘ └────────────┬────────────┘ │
│           │                      │                        │              │
│  ┌────────▼──────────────────────▼────────────────────────▼────────────┐ │
│  │               Spring AI (OpenAI Protocol Abstraction)               │ │
│  └───────────────────────────────┬─────────────────────────────────────┘ │
└──────────────────────────────────┼───────────────────────────────────────┘
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
        本地/云端 LLM           ChromaDB            SearXNG
    (LM Studio/Ollama/     (Vector Store)       (Private Web
      DeepSeek/OpenAI)     REST API v2            Search Engine)
```

---

<a name="快速部署指南"></a>

## 🚀 快速部署指南 (Quick Start)

### 选项 A：使用 Docker Compose 一键启动 (强烈推荐)

```bash
git clone https://github.com/SAKURA1175/aishow.git
cd aishow

# 复制配置文件模板
cp .env.example .env

# 一键启动
docker-compose up -d --build
```
启动成功后，浏览器访问 **`http://localhost:8090`** 即可进入系统。

> 🔑 **默认管理员账号**：`admin`  
> 🔑 **默认管理员密码**：`admin123` *(请在首次登录后于管理后台修改)*

---

<a name="完整数据库建表-sql"></a>

## 🗄️ 完整数据库建表 SQL

系统支持自动初始化。如需手动建立 MySQL 物理表结构，请在 `study_ai` 数据库中执行以下完整的 SQL 语句：

```sql
CREATE DATABASE IF NOT EXISTS `study_ai` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `study_ai`;

-- 1. 用户基本信息与鉴权表 (user)
CREATE TABLE IF NOT EXISTS `user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` varchar(64) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT 'BCrypt加密密码',
  `role` varchar(16) NOT NULL DEFAULT 'student' COMMENT '角色: student/teacher/admin',
  `avatar_url` varchar(500) DEFAULT NULL COMMENT '头像图片地址',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 对话会话表 (chat_session)
CREATE TABLE IF NOT EXISTS `chat_session` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `user_id` bigint NOT NULL COMMENT '所属用户ID',
  `title` varchar(100) DEFAULT '新的对话' COMMENT '会话标题',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话会话表';

-- 3. 对话消息历史表 (chat_message)
CREATE TABLE IF NOT EXISTS `chat_message` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id` bigint NOT NULL COMMENT '所属会话ID',
  `role` varchar(16) NOT NULL COMMENT '发送角色: user/assistant/system',
  `content` longtext NOT NULL COMMENT '消息文本内容',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话消息表';

-- 4. 教学文档元数据表 (document)
CREATE TABLE IF NOT EXISTS `document` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '文档ID',
  `name` varchar(255) NOT NULL COMMENT '原始文件名',
  `content` longtext COMMENT '全文提取内容',
  `upload_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文档元数据表';

-- 5. 文档切片明细表 (document_chunk)
CREATE TABLE IF NOT EXISTS `document_chunk` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '切片ID',
  `document_id` bigint NOT NULL COMMENT '所属文档ID',
  `content` text NOT NULL COMMENT '切片段落文本',
  `chunk_index` int DEFAULT '0' COMMENT '切片序号',
  PRIMARY KEY (`id`),
  KEY `idx_document_id` (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文档切片表';

-- 6. 向量映射索引表 (document_embedding)
CREATE TABLE IF NOT EXISTS `document_embedding` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `chunk_id` bigint NOT NULL COMMENT '关联切片ID',
  `document_id` bigint NOT NULL COMMENT '关联文档ID',
  `chroma_id` varchar(100) DEFAULT NULL COMMENT 'ChromaDB向量索引ID',
  PRIMARY KEY (`id`),
  KEY `idx_chunk_id` (`chunk_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='向量映射表';

-- 7. 学习画像表 (learning_profile)
CREATE TABLE IF NOT EXISTS `learning_profile` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '画像ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `profile_data` longtext COMMENT 'JSON格式的学情画像与能力分布',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习画像表';

-- 8. 提问日志表 (user_question_log)
CREATE TABLE IF NOT EXISTS `user_question_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `question` text COMMENT '提问内容',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '提问时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提问日志表';

-- 插入默认系统管理员账号 (admin / admin123)
INSERT IGNORE INTO `user` (`username`, `password`, `role`)
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTyRQW9e6K', 'admin');
```

---

<a name="核心-api-接口总结"></a>

## 🔌 核心 API 接口总结 (API Reference)

| 模块控制器 | 接口路径 | 传输协议 | 关键功能 |
|---|---|---|---|
| `ChatController` | `/api/chat` | HTTP / **SSE** | SSE 流式问答 (`/stream`)、终止生成、生成会话标题 |
| `AdminController` | `/api/admin` | HTTP REST | 模型 Endpoint 热更新、System Prompt 在线修改 |
| `DocumentController` | `/api/document` | HTTP REST | 教学文档上传、自动解析切片、向量化与降级查询 |
| `LearningProfileController` | `/api/profile` | HTTP REST | 提问历史学科分类、D3 知识树节点数据获取 |
| `LearningFlowController` | `/api/learning-flow` | HTTP REST | 简历文本抽取、技能 Gap 匹配分析、学习路径推荐 |
| `AssignmentController` | `/api/assignments` | HTTP REST | 教师发布作业、学生提交附件、AI 智能预批注打分 |
| `ExamController` | `/api/exams` | HTTP REST | 在线测试卷调取、自动交卷判分、生成错题诊断 |

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源协议发布。
