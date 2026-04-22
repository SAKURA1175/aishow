# Study AI · 配置参考手册

> 所有配置项的完整说明、默认值和推荐值

---

## 本地开发配置文件

### `src/main/resources/redis.properties`

这是最重要的配置文件，包含 AI 模型和 Redis 的所有配置。

#### Redis 配置

```properties
# Redis 服务器地址
# 本地开发：localhost
# 服务器部署（Docker 容器间通信）：redis-aishow
redis.host=localhost

# Redis 端口，默认 6379
redis.port=6379
```

---

#### AI 大模型配置

```properties
# 使用的模型名称（必须与 API 服务商支持的模型名一致）
ai.model=deepseek-chat

# API 地址（末尾不要加斜杠）
ai.api.url=https://api.deepseek.com/v1

# API 密钥（sk- 开头）
ai.api.key=sk-xxxxxxxxxxxxxxxxxxxxx

# 连接超时（毫秒），建议 5000-10000
ai.api.connect-timeout-ms=5000

# 读取超时（毫秒），AI 生成可能较慢，建议 90000-120000
ai.api.read-timeout-ms=120000
```

**支持的 AI 服务商列表：**

| 服务商 | 模型名 | API 地址 | 价格 |
|---|---|---|---|
| DeepSeek | `deepseek-chat` | `https://api.deepseek.com/v1` | ¥1/百万token |
| 通义千问 | `qwen-turbo` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | ¥0.3/百万token |
| 智谱 | `glm-4-flash` | `https://open.bigmodel.cn/api/paas/v4` | 免费tier |
| Kimi | `moonshot-v1-8k` | `https://api.moonshot.cn/v1` | ¥12/百万token |
| Gemini（中转）| `gemini-2.0-flash` | 中转地址 | 按中转定价 |
| 本地 LM Studio | 模型名 | `http://localhost:1234` | 免费 |

---

#### Embedding（文字转向量）配置

```properties
# 是否启用 Embedding（关闭后知识库检索功能不可用）
# 默认 true，只有在 Embedding API 完全不可用时才改 false
ai.embedding.enabled=true

# Embedding 模型名称
ai.embedding.model=BAAI/bge-m3

# Embedding API 地址
ai.embedding.api-url=https://api.siliconflow.cn/v1

# Embedding API 密钥
ai.embedding.api-key=sk-xxxxxxxxxxxxxxxxxxxxx

# 连接超时（毫秒）
ai.embedding.connect-timeout-ms=5000

# 读取超时（毫秒）
ai.embedding.read-timeout-ms=30000
```

**支持的 Embedding 服务：**

| 服务 | 模型 | API 地址 | 价格 |
|---|---|---|---|
| 硅基流动（推荐）| `BAAI/bge-m3` | `https://api.siliconflow.cn/v1` | ¥14免费额度 |
| 本地 LM Studio | `text-embedding-bge-m3` | `http://localhost:1234` | 免费（需本地运行）|
| OpenAI | `text-embedding-3-small` | `https://api.openai.com/v1` | 按量计费 |

---

#### ChromaDB 配置

```properties
# ChromaDB API 地址
# 本地开发：http://localhost:8000/api/v2
# Docker 容器间：http://chroma:8000/api/v2
ai.chroma.base-url=http://localhost:8000/api/v2

# Tenant 名称（多租户场景区分）
ai.chroma.tenant=default_tenant

# Database 名称
ai.chroma.database=default_database

# Collection 名称（主知识库）
ai.chroma.collection=study_docs

# 连接超时（毫秒）
ai.chroma.connect-timeout-ms=1500

# 读取超时（毫秒）
ai.chroma.read-timeout-ms=4000
```

---

#### RAG 检索参数

这些参数影响知识库检索的质量和效率：

```properties
# 检索最相关的文档片段数量
# 越多：信息越全面，但 Prompt 越长（费 token）
# 推荐：3-6
ai.rag.retrieval-top-k=4

# 注入 Prompt 的知识库内容最大字符数
# 越大：信息越多，但 AI 处理越慢，token 消耗越多
# 推荐：1000-2000
ai.rag.max-prompt-chars=1400

# 每个知识片段的最大字符数
# 片段过长会稀释注意力
ai.rag.max-snippet-chars=320

# 携带的历史消息最大条数
# 越多：上下文越好，但 token 消耗越多
ai.rag.max-history-messages=20

# 历史消息总字符数上限
ai.rag.max-history-chars=12000

# MySQL 降级检索时最多扫描的行数（性能保护）
ai.rag.max-fallback-scan-rows=2000
```

---

### `src/main/resources/db.properties`

```properties
# MySQL JDBC 驱动（不需要改）
jdbc.driver=com.mysql.cj.jdbc.Driver

# 数据库连接地址
# 本地开发：localhost:3306
# Docker 部署时通过环境变量 AISHOW_JDBC_URL 覆盖
jdbc.url=jdbc:mysql://localhost:3306/study_ai?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai

# 数据库用户名
jdbc.username=root

# 数据库密码
jdbc.password=1234
```

---

### `src/main/resources/application.yml`

```yaml
spring:
  mvc:
    async:
      # 异步请求超时（毫秒），必须足够长（SSE 可能持续几分钟）
      request-timeout: 300000  # 5分钟

server:
  port: 8090
  tomcat:
    # Tomcat 连接超时（毫秒）
    connection-timeout: 300000
    # Keep-Alive 超时
    keep-alive-timeout: 300000

management:
  endpoints:
    web:
      exposure:
        # 暴露健康检查和基本信息接口
        include: health,info
```

---

## Docker 部署环境变量

服务器部署时，通过 `.env` 文件覆盖所有配置：

### 完整 `.env` 模板

```bash
# ============================================================
# Study AI 生产环境配置
# 复制此文件为 .env，填入真实值
# ============================================================

# ====== AI 大模型 ======
# 模型名称（与 API 服务商匹配）
AISHOW_AI_MODEL=deepseek-chat

# API 地址（末尾不加斜杠）
AISHOW_AI_API_URL=https://api.deepseek.com/v1

# API 密钥
AISHOW_AI_API_KEY=sk-换成你的DeepSeek密钥

# 连接超时（毫秒）
AISHOW_AI_API_CONNECT_TIMEOUT_MS=5000

# 读取超时（毫秒）
AISHOW_AI_API_READ_TIMEOUT_MS=120000

# ====== Embedding ======
# Embedding 是否启用（true/false）
AISHOW_AI_EMBEDDING_ENABLED=true

# Embedding 模型名
AISHOW_AI_EMBEDDING_MODEL=BAAI/bge-m3

# Embedding API 地址
AISHOW_AI_EMBEDDING_API_URL=https://api.siliconflow.cn/v1

# Embedding API 密钥
AISHOW_AI_EMBEDDING_API_KEY=sk-换成你的硅基流动密钥

# Embedding 读取超时
AISHOW_AI_EMBEDDING_READ_TIMEOUT_MS=30000

# ====== ChromaDB ======
# 容器间通信使用容器名
AISHOW_AI_CHROMA_BASE_URL=http://chroma:8000/api/v2
AISHOW_AI_CHROMA_TENANT=default_tenant
AISHOW_AI_CHROMA_DATABASE=default_database
AISHOW_AI_CHROMA_COLLECTION=study_docs

# ====== MySQL 数据库 ======
# 容器间通信使用容器名 aishow-mysql
AISHOW_JDBC_URL=jdbc:mysql://aishow-mysql:3306/study_ai?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
AISHOW_JDBC_USERNAME=root
# 修改为强密码！
AISHOW_JDBC_PASSWORD=YourStr0ng@Password2025

# ====== Redis ======
# 容器间通信使用容器名
AISHOW_REDIS_HOST=redis-aishow
AISHOW_REDIS_PORT=6379

# ====== 端口配置（可选，默认值如右） ======
AISHOW_BACKEND_PORT=8090
AISHOW_SEARXNG_PORT=8081
AISHOW_OPEN_WEBUI_PORT=3001

# ====== SearxNG ======
# SearxNG 用于联网搜索的密钥（随机字符串即可）
AISHOW_SEARXNG_SECRET=change-this-to-random-string-at-least-32-chars

# ====== Java 运行参数 ======
AISHOW_JAVA_TOOL_OPTIONS=-Duser.home=/app/data -Dfile.encoding=UTF-8

# ====== RAG 参数（可选，有默认值）======
# AISHOW_AI_RAG_RETRIEVAL_TOP_K=4
# AISHOW_AI_RAG_MAX_PROMPT_CHARS=1400
# AISHOW_AI_RAG_MAX_HISTORY_MESSAGES=20
```

---

## System Prompt 配置

System Prompt 是控制 AI 人格和行为的核心。

### 文件位置

```
src/main/resources/
├── ai-teacher-prompt.txt    ← 学生使用（AI 扮演老师）
└── ai-assistant-prompt.txt  ← 教师使用（AI 扮演助手）
```

### 修改方式

**方式1：直接编辑文件**（需要重启服务器生效）

**方式2：管理员后台热修改**（实时生效，无需重启）
1. 以 admin 账号登录
2. 进入「管理后台」→「提示词管理」
3. 修改 System Prompt 后点保存
4. 系统通过 `SystemPromptProvider.setPrompt()` 更新内存缓存

---

## 数据库表结构参考

### 核心表

```sql
-- 用户表
CREATE TABLE user (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,  -- BCrypt 加密
    role        VARCHAR(20) NOT NULL DEFAULT 'student',  -- student/teacher/admin
    avatar      VARCHAR(500),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 对话 Session 表
CREATE TABLE chat_session (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    title       VARCHAR(200),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 消息表
CREATE TABLE chat_message (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id  BIGINT NOT NULL,
    role        VARCHAR(20) NOT NULL,   -- user/assistant/system
    content     LONGTEXT NOT NULL,
    token_count INT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文档表
CREATE TABLE document (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename    VARCHAR(255) NOT NULL,
    file_type   VARCHAR(20),            -- pdf/docx/txt/md
    uploader_id BIGINT NOT NULL,
    stored_filename VARCHAR(300),       -- 磁盘上的实际文件名
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文档切片表
CREATE TABLE document_chunk (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    content     TEXT NOT NULL,
    chunk_index INT NOT NULL,
    char_count  INT
);

-- 文档向量备份（ChromaDB 降级用）
CREATE TABLE document_embedding (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    chunk_id    BIGINT NOT NULL UNIQUE,
    embedding   MEDIUMBLOB NOT NULL  -- 序列化的 float[] 向量
);

-- 简历表
CREATE TABLE resume (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    filename        VARCHAR(255) NOT NULL,
    file_type       VARCHAR(16) NOT NULL,
    raw_text        LONGTEXT,           -- 提取的原始文本
    structured_json LONGTEXT,           -- AI 结构化解析结果
    analysis_json   LONGTEXT,           -- AI 分析报告
    score           INT,                -- 简历评分 0-100
    create_time     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 引导学习进度表
CREATE TABLE learning_flow_progress (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    flow_type     VARCHAR(32) NOT NULL,
    current_step  INT NOT NULL DEFAULT 0,
    total_steps   INT NOT NULL,
    step_data     LONGTEXT,             -- 各步骤答案 JSON
    status        VARCHAR(16) NOT NULL DEFAULT 'in_progress',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## API 接口汇总

### 用户接口

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/user/login` | 登录 | 公开 |
| POST | `/api/user/register` | 注册 | 公开 |
| GET | `/api/user/current` | 获取当前用户 | 已登录 |
| POST | `/api/user/logout` | 退出登录 | 已登录 |

### 对话接口

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/chat/stream` | SSE 流式问答 | 已登录 |
| GET | `/api/chat/sessions` | 对话列表 | 已登录 |
| GET | `/api/chat/sessions/{id}/messages` | 消息历史 | 已登录 |
| DELETE | `/api/chat/sessions/{id}` | 删除对话 | 已登录 |

### 简历接口

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/resume/upload` | 上传简历 | 已登录 |
| GET | `/api/resume/list` | 简历列表 | 已登录 |
| GET | `/api/resume/{id}` | 简历详情 | 已登录 |
| GET | `/api/resume/{id}/analyze` | SSE 流式分析 | 已登录 |
| POST | `/api/resume/{id}/ask` | SSE 追问 | 已登录 |
| DELETE | `/api/resume/{id}` | 删除简历 | 已登录 |
| POST | `/api/resume/kb/import` | 导入知识库 | teacher/admin |

### 文档接口

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | `/api/documents/upload` | 上传文档 | teacher/admin |
| GET | `/api/documents/list` | 文档列表 | 已登录 |
| DELETE | `/api/documents/{id}` | 删除文档 | teacher/admin |

### 管理接口

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/api/admin/users` | 用户列表 | admin |
| POST | `/api/admin/knowledge/import` | 批量导入知识库 | admin/teacher |
| GET | `/api/admin/model/presets` | 模型预设列表 | admin |
| POST | `/api/admin/model/config` | 修改模型配置 | admin |

### 系统接口

| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | `/actuator/health` | 健康检查 | 公开 |
| GET | `/actuator/info` | 应用信息 | 公开 |

---

*所有文档索引：[README.md](../README.md)*
