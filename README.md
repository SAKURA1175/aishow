<div align="center">
  <img src="./frontend/src/assets/vite.svg" alt="Study AI Logo" width="120" />
  <h1>✨ Study AI (学业辅助 AI 平台) ✨</h1>
  <p><strong>基于 Spring Boot 3 + Spring AI + React 构建的现代化智能学习辅助系统</strong></p>
  
  [![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=java&logoColor=white)](https://www.java.com)
  [![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.6-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
</div>

---

## 🌟 项目简介

**Study AI** 是一款专为学生和教育工作者设计的现代化 AI 学业辅助平台。项目完全基于最新的 **Spring Boot 3** 和 **Spring AI** 框架，前端采用 **React + Tailwind CSS**，为你带来极速、流畅且极具未来感的交互体验。

本项目不仅支持基础的问答，更深度集成了 **原生大模型深度思考 (Deep Thinking) 流式输出** 功能，通过拦截和解析模型底层的 `reasoning_content`，将 AI 的推理解题过程直观地展示在前端（支持无缝折叠/展开），完美适配如 Gemma 4 E4B 等具备高级推理能力的本地或云端大语言模型。

---

## 🚀 核心功能亮点

- 🧠 **原生深度思考 (Deep Thinking) 支持**：支持无缝解析并渲染 AI 模型的“心智推理过程”。前端采用定制化的思维链折叠 UI，推理过程尽在掌握。
- ⚡️ **全链路并发流式输出 (SSE)**：基于 Spring WebFlux 提供极致的响应速度。支持多会话 (Session) 并发聊天状态隔离，切后台绝不丢失上下文或加载动画。
- 🎨 **极具未来感的 UI 交互**：由 React + Tailwind CSS 驱动。拥有深色模式、微动画过渡、毛玻璃质感、沉浸式星空粒子特效和流光溢彩的 Markdown 代码渲染组件。
- 📄 **文档知识库沉淀 (RAG 预留)**：集成了强大的文档结构解析与嵌入支持，可对用户上传的学术材料进行智能知识问答和归纳（支持 MyBatis + MySQL 数据持久化）。
- 🖼️ **多模态图像支持**：支持基于 Base64 流式的图像上传和多模态 AI 模型交互分析，一键解出复杂理科图形题。

---

## 🛠️ 技术栈架构

### 后端 (Backend)
* **核心框架**：Spring Boot 3.3.6
* **AI 集成**：Spring AI (1.0.0-M6)
* **数据库 & ORM**：MySQL 8.0 + MyBatis
* **缓存层**：Redis (用于限流和快速状态存储)
* **流式通讯**：Spring WebFlux / SSE (Server-Sent Events)

### 前端 (Frontend)
* **核心框架**：React 18 + Vite 🚀
* **样式引擎**：Tailwind CSS + shadcn/ui
* **状态管理**：Zustand
* **Markdown 渲染**：Marked + Highlight.js (定制的 `<think>` 标签解析)
* **路由**：React Router DOM

---

## 💻 快速开始

### 1. 环境依赖
* Java 17 或更高版本
* Node.js 18+ (用于前端构建)
* MySQL 8.0+
* Redis
* 一款支持 OpenAI 兼容 API 的大模型服务（例如通过 LM Studio 本地部署的 Gemma 4 E4B / DeepSeek-R1）

### 2. 后端配置与启动
克隆代码并进入项目目录：
```bash
git clone https://github.com/yourusername/aishow.git
cd aishow
```

修改 `src/main/resources/redis.properties` 或 `application.yml` 配置你的数据库和 AI 模型密钥：
```properties
# 数据库配置示例
jdbc.driver=com.mysql.cj.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/aishow?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
jdbc.username=root
jdbc.password=123456

# AI 模型配置 (例如本地 LM Studio)
ai.api.url=http://localhost:1234
ai.api.key=lm-studio
ai.model=gemma-4-e4b-it
```

启动 Spring Boot 服务：
```bash
mvn clean spring-boot:run
```

### 3. 前端编译与运行
进入 frontend 目录安装依赖并启动 Vite 服务器：
```bash
cd frontend
npm install
npm run dev
```
打开浏览器访问：`http://localhost:5173` 即可开始体验！

---

## 💡 关于 "Deep Thinking" (思考过程) 渲染说明

我们在最新版本中重写了底层通讯。若你要使用类似 Gemma 4 这样具有原生 reasoning 能力的模型：
1. 请在您的 LM Studio 服务器设置中开启 **"separate reasoning_content and content in API responses"**。
2. 我们的 `SpringAiChatService` 会自动拦截 SSE 流中的 `<channel|>` 标记，将其无缝映射为前端 MarkdownRenderer 期待的 `<think>` 和 `</think>` 标签。
3. 如果模型在思考时输出英文，系统已在内部 System Prompt 中默认添加指令，强制大模型以流利中文展现分析过程！

---

<div align="center">
  <i>If you find this project useful, please consider giving it a ⭐!</i>
</div>
