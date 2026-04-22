# Study AI · 本地开发环境搭建

> 手把手教你在 Mac/Linux 上把项目跑起来（约需 20-30 分钟）

---

## 前置条件

在开始之前，确认你有：
- [ ] Mac 或 Linux 电脑（Windows 需要 WSL2）
- [ ] 稳定的网络连接（需要下载依赖）
- [ ] 至少 8GB 可用内存
- [ ] 至少 10GB 可用磁盘空间

---

## 第一步：安装基础软件

### 1.1 安装 Homebrew（Mac 专属，Linux 跳过）

Homebrew 是 Mac 上最好用的包管理器，如果没有先安装：

```bash
# 打开终端（Launchpad → 其他 → 终端）
# 粘贴以下命令并回车
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装过程需要输入你的 Mac 密码
# 等待约 5-10 分钟

# 验证安装成功
brew --version
# 应该显示：Homebrew 4.x.x
```

### 1.2 安装 Java 21

```bash
# Mac
brew install openjdk@21

# 配置环境变量（让系统找到 Java）
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Ubuntu/Debian Linux
sudo apt update
sudo apt install openjdk-21-jdk -y

# 验证（所有系统）
java -version
# 应该显示：openjdk version "21.x.x"

javac -version
# 应该显示：javac 21.x.x
```

> ⚠️ 必须是 Java 21，低版本不支持 Spring Boot 3.x

### 1.3 安装 Maven

Maven 是 Java 项目的构建工具，用来下载依赖和编译项目：

```bash
# Mac
brew install maven

# Ubuntu/Debian
sudo apt install maven -y

# 验证
mvn -version
# 应该显示：Apache Maven 3.x.x
```

### 1.4 安装 Node.js 20

```bash
# Mac
brew install node@20

# 配置 PATH（如果 brew 提示需要）
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# 验证（所有系统）
node -v
# 应该显示：v20.x.x

npm -v
# 应该显示：10.x.x
```

### 1.5 安装 Docker Desktop

Docker 用来运行 MySQL、Redis、ChromaDB 等依赖服务。

**Mac**：
1. 打开 https://www.docker.com/products/docker-desktop/
2. 点击 "Download for Mac"（选 Apple Silicon 或 Intel 对应的版本）
3. 下载 `.dmg` 文件，双击安装
4. 安装完后打开 Docker Desktop
5. 等待右下角任务栏图标变成**绿色的鲸鱼**

**Linux**：
```bash
# 一键安装 Docker
curl -fsSL https://get.docker.com | sh

# 把当前用户加入 docker 组（避免每次都要 sudo）
sudo usermod -aG docker $USER

# 重新加载权限（必须！）
newgrp docker

# 安装 docker compose 插件
sudo apt install docker-compose-plugin -y

# 验证
docker --version
# 应该显示：Docker version 26.x.x

docker compose version
# 应该显示：Docker Compose version 2.x.x
```

---

## 第二步：获取 API Key

系统需要两个 API Key：一个用于 AI 对话，一个用于文字转向量。

### 2.1 DeepSeek API Key（AI 对话）

1. 打开浏览器，访问：**https://platform.deepseek.com**
2. 点右上角「注册」
3. 填写手机号 → 获取验证码 → 设置密码 → 注册
4. 登录后点左侧菜单「**API Keys**」
5. 点「**创建 API Key**」按钮
6. Name 随便填（如：`study-ai-dev`）
7. 点确认后会显示 Key，格式是 `sk-xxxxxxxxxxxxxxxxxxxxx`
8. **立刻复制保存**！（关闭弹窗后就看不到了）
9. 充值：左侧「充值」→ 微信/支付宝 → 最低充 ¥10

### 2.2 硅基流动 API Key（Embedding，文字转向量）

1. 打开浏览器，访问：**https://cloud.siliconflow.cn**
2. 点右上角「注册」→ 邮箱注册
3. 验证邮箱
4. 登录后点右上角**头像** → 「API 密钥」
5. 点「**新建 API 密钥**」
6. 复制保存（格式同为 `sk-xxx...`）
7. 注册即赠 **¥14** 免费额度（够用很久，因为 Embedding 非常便宜）

---

## 第三步：克隆项目代码

```bash
# 选一个你喜欢的目录，比如桌面
cd ~/Desktop

# 克隆代码（如果仓库是私有的，需要先登录 GitHub）
git clone https://github.com/SAKURA1175/aishow.git

# 进入项目目录
cd aishow

# 查看项目结构，确认克隆成功
ls -la
# 应该看到：
# Dockerfile
# docker-compose.yml
# frontend/          ← React 前端
# src/               ← Java 后端源码
# pom.xml            ← Maven 配置
# sql/               ← 数据库脚本
# kb_data/           ← 知识库爬虫脚本
```

---

## 第四步：配置项目

### 4.1 配置 AI 参数

这是最重要的一步。用文本编辑器打开：

```bash
# Mac 用 TextEdit 打开
open -e src/main/resources/redis.properties

# 或用 VS Code
code src/main/resources/redis.properties

# 或直接用命令行编辑
nano src/main/resources/redis.properties
```

文件内容改成（把示例值替换为你自己的）：

```properties
# Redis 配置（本地开发默认，不用改）
redis.host=localhost
redis.port=6379

# ============ AI 大模型配置 ============
# 使用 DeepSeek（推荐，最便宜）
ai.model=deepseek-chat
ai.api.url=https://api.deepseek.com/v1
ai.api.key=sk-你的DeepSeek密钥粘贴在这里

# 超时设置（网络慢可以调大）
ai.api.connect-timeout-ms=5000
ai.api.read-timeout-ms=120000

# ============ Embedding 配置 ============
# 使用硅基流动（免费额度，BGE-M3 模型）
ai.embedding.enabled=true
ai.embedding.model=BAAI/bge-m3
ai.embedding.api-url=https://api.siliconflow.cn/v1
ai.embedding.api-key=sk-你的硅基流动密钥粘贴在这里
ai.embedding.connect-timeout-ms=5000
ai.embedding.read-timeout-ms=30000

# ============ ChromaDB 配置 ============
# 本地 Docker 运行，默认配置即可
ai.chroma.base-url=http://localhost:8000/api/v2
ai.chroma.tenant=default_tenant
ai.chroma.database=default_database
ai.chroma.collection=study_docs

# ============ RAG 参数 ============
ai.rag.retrieval-top-k=4       # 检索最相关的 4 个片段
ai.rag.max-prompt-chars=1400   # 知识库内容最多 1400 字
ai.rag.max-history-messages=20 # 最多带 20 条历史消息
ai.rag.max-history-chars=12000 # 历史消息最多 12000 字
```

**保存文件**（如果是 nano：`Ctrl+X` → 输入 `Y` → 回车）

### 4.2 验证数据库配置

查看 `src/main/resources/db.properties`：

```properties
jdbc.driver=com.mysql.cj.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/study_ai?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
jdbc.username=root
jdbc.password=1234
```

这是本地 Docker MySQL 的默认配置，不需要改。

---

## 第五步：启动 Docker 依赖服务

```bash
# 确保在项目根目录
cd ~/Desktop/aishow

# 启动所有依赖容器（后台运行）
docker compose up -d

# 等待约 30 秒，然后查看状态
docker ps

# 正确输出应该包含（STATUS 都是 Up）：
# aishow-mysql      Up (healthy)
# redis-aishow      Up
# chroma            Up
# aishow-searxng    Up
```

**如果某个容器没起来，排查方法：**

```bash
# 查看具体错误日志
docker logs aishow-mysql
docker logs redis-aishow
docker logs chroma

# 强制重新创建容器
docker compose down
docker compose up -d
```

---

## 第六步：初始化数据库

等 MySQL 容器完全启动后（看到 `Up (healthy)`），执行建表：

```bash
# 主要数据表（用户、文档、对话等）
docker exec -i aishow-mysql mysql -uroot -p1234 study_ai < sql/init.sql

# 如果 init.sql 不存在，先创建数据库
docker exec -i aishow-mysql mysql -uroot -p1234 -e "CREATE DATABASE IF NOT EXISTS study_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 简历优化模块的表
docker exec -i aishow-mysql mysql -uroot -p1234 study_ai < sql/resume_module.sql

# 验证表创建成功
docker exec -it aishow-mysql mysql -uroot -p1234 -e "USE study_ai; SHOW TABLES;"

# 应该看到类似：
# user
# chat_session
# chat_message
# document
# document_chunk
# document_embedding
# user_question_log
# learning_profile
# resume
# learning_flow_progress
```

---

## 第七步：启动后端

```bash
cd ~/Desktop/aishow

# 启动（会下载依赖，第一次需要几分钟）
mvn spring-boot:run

# 等待看到这行说明启动成功：
# Started StudyAiApplication in X.XXX seconds (process running for X.XXX)

# 新开终端窗口，验证后端运行：
curl http://localhost:8090/actuator/health
# 返回：{"status":"UP"} ← 正常
```

**常见启动失败原因：**

```bash
# 错误1：端口 8090 被占用
lsof -i :8090  # 查看占用进程
kill -9 进程PID  # 强制关闭

# 错误2：数据库连接失败
# → 确认 Docker MySQL 容器在运行：docker ps | grep mysql
# → 确认 db.properties 配置正确

# 错误3：Java 版本不对
java -version  # 必须是 21
```

---

## 第八步：启动前端

**新开一个终端窗口**（保持后端那个终端不动）：

```bash
cd ~/Desktop/aishow/frontend

# 第一次需要安装依赖（约 2-3 分钟）
npm install

# 启动开发服务器
npm run dev

# 成功后看到：
# VITE v8.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

打开浏览器访问：**http://localhost:5173**

你应该看到 Study AI 的登录页面。

**默认测试账号：**

| 用户名 | 密码 | 角色 | 权限说明 |
|---|---|---|---|
| testteacher | 123456 | teacher | 可上传文档、使用全部功能 |
| （需自己注册）| - | student | 基础问答功能 |

---

## 第九步：初始化知识库（可选）

知识库初始化会自动爬取数据并写入 ChromaDB，让 AI 有知识可以检索。

```bash
# 确保后端正在运行（第七步）
# 新开终端

cd ~/Desktop/aishow/kb_data

# 安装 Python 依赖（通常系统自带 Python3）
python3 --version  # 确认 Python3 存在

# 初始化主知识库（计算机技术文章，约需 3-5 分钟）
python3 scrape_and_import.py
# 脚本会自动：
# 1. 爬取 Wikipedia 技术文章（30+ 篇）
# 2. 爬取 GitHub 优秀 README
# 3. 登录后台（testteacher/123456）
# 4. 批量上传到知识库

# 初始化简历知识库（约需 1 分钟）
python3 resume_kb_init.py
# 会写入 8 篇简历写作知识到 resume_kb collection
```

---

## 第十步：测试功能

现在所有服务都跑起来了，测试一下：

1. **登录**：用 testteacher/123456 以 Teacher 角色登录

2. **AI 问答**：在聊天框输入"什么是Spring Boot"，应该看到流式回答

3. **联网搜索**：点开「联网搜索」开关，提问时会有实时搜索

4. **深度思考**：点开「深度思考」开关，AI 会先展示思维过程

5. **上传文档**：点左上角「文档」→「上传文档」，上传一个 PDF，然后问相关问题

6. **简历优化**：左侧菜单点「简历优化」，上传简历 PDF 进行 AI 分析

---

## 服务汇总

| 服务 | 地址 | 说明 |
|---|---|---|
| 前端 | http://localhost:5173 | React 开发服务器 |
| 后端 | http://localhost:8090 | Spring Boot |
| 健康检查 | http://localhost:8090/actuator/health | 后端是否正常 |
| ChromaDB | http://localhost:8000 | 向量数据库 |
| SearxNG | http://localhost:8081 | 搜索引擎（可直接访问测试）|
| Open WebUI | http://localhost:3001 | 可选 AI 界面 |

---

*下一篇：[05-cloud-deploy.md](./05-cloud-deploy.md)*
