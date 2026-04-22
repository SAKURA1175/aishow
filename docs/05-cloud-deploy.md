# Study AI · 云端部署指南（Oracle Cloud 免费 + Cloudflare Pages）

> 完全免费方案，Oracle Cloud 永久免费 4核24G 服务器 + Cloudflare 全球 CDN

---

## 方案概览

```
用户
 ↓ HTTPS（Cloudflare 自动提供 SSL）
Cloudflare Pages（前端，免费全球 CDN）
 ↓ 代理 /api/* 到服务器
Oracle Cloud ARM VM（免费，永久）
 ├── Nginx（80/443 端口）
 ├── aishow-backend（Spring Boot :8090）
 ├── aishow-mysql（MySQL :3306）
 ├── redis-aishow（Redis :6379）
 ├── chroma（ChromaDB :8000）
 └── aishow-searxng（SearxNG :8081）
```

**总费用：¥0/月**（除 AI API 调用费，DeepSeek 约 ¥0.001/千token，极便宜）

---

## 第一阶段：注册 Oracle Cloud 账号

### 步骤 1.1：打开注册页面

浏览器访问：**https://www.oracle.com/cloud/free/**

点击页面中间的「**Start for free**」按钮

### 步骤 1.2：填写基本信息

| 字段 | 填写建议 |
|---|---|
| Country/Territory | China（中国）|
| First Name / Last Name | 真实姓名（用于账单，不会扣费）|
| Email | 用真实邮箱（用于接收验证码）|

### 步骤 1.3：选择区域（重要！）

Home Region 选择：**Japan East (Tokyo)**
- 距离中国大陆最近
- 网络延迟约 60-80ms
- 免费资源最充足

> ⚠️ 区域一旦选定无法修改，请慎重选择

### 步骤 1.4：设置密码

密码要求：8位以上，包含大小写字母、数字、特殊字符

示例：`StudyAI@2025`

### 步骤 1.5：验证手机号

填写手机号（+86 开头），接收短信验证码

### 步骤 1.6：填写信用卡（验证身份用，不扣费）

必须填写，用于验证真实身份。Oracle 会扣 $1 然后立即退还（预授权验证）。

支持：VISA / MasterCard / 国内双币信用卡

> ✅ 填完后不会有任何费用扣除，All Free Tier 资源永久免费

### 步骤 1.7：等待账号激活

通常 5-30 分钟，最长 24 小时。收到激活邮件后继续下一步。

---

## 第二阶段：创建云服务器

### 步骤 2.1：登录控制台

打开 **https://cloud.oracle.com**，用刚注册的账号登录

### 步骤 2.2：进入计算实例

左上角☰菜单 → **Compute** → **Instances**

点击「**Create instance**」

### 步骤 2.3：配置实例

**Name（名称）：** `aishow-server`

**Placement（区域）：** 默认，就是你注册时选的 Tokyo

**Image and shape（镜像和配置）：**

点「**Change image**」：
- Image source: Oracle Linux（默认），改成 **Canonical Ubuntu**
- OS version: 选 **22.04**
- 点确认

点「**Change shape**」：
- Instance type: 选 **Ampere**（ARM 架构，这是免费的）
- Shape: `VM.Standard.A1.Flex`
- OCPUs: 拖到 **4**（最大免费额度）
- Memory: 自动变成 **24 GB**（最大免费额度）
- 点确认

**Networking（网络）：** 默认不动

**Add SSH keys（SSH 密钥）：**

方式一（推荐，自动生成）：
- 选「Generate a key pair for me」
- 点「**Save private key**」下载私钥
- 文件名类似 `ssh-key-2025-04-22.key`
- **妥善保存这个文件！丢了就连不上服务器了！**

方式二（使用已有密钥）：
```bash
# 如果你本地有 SSH 密钥，查看公钥
cat ~/.ssh/id_rsa.pub
# 或
cat ~/.ssh/id_ed25519.pub
```
把公钥内容粘贴进去。

**Boot volume（启动盘）：**
- Size: 改成 **100 GB**（免费额度内）

### 步骤 2.4：创建实例

点底部「**Create**」按钮

等待约 2-3 分钟，状态从 Provisioning 变成 **Running**（绿色）

记录下你的 **Public IP address**（公网 IP），格式如：`140.238.xx.xx`

---

## 第三阶段：开放防火墙端口

Oracle Cloud 有两层防火墙，都要配置。

### 步骤 3.1：配置 Oracle 安全组

在实例详情页：
1. 左侧「Primary VNIC」→ 点 Subnet 链接
2. 点「Security Lists」→ 点「Default Security List」
3. 点「**Add Ingress Rules**」

添加以下规则（每条规则一次添加）：

| Source CIDR | IP Protocol | Destination Port | 描述 |
|---|---|---|---|
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |

> 注意：8090 端口不要对外开放，通过 Nginx 代理

点「Add Ingress Rules」保存。

### 步骤 3.2：配置服务器内部防火墙

SSH 连接进服务器后（下一步），执行：

```bash
# 开放 HTTP 和 HTTPS
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT

# 保存规则（重启后生效）
sudo apt install iptables-persistent -y
sudo netfilter-persistent save
```

---

## 第四阶段：连接服务器

### 步骤 4.1：设置私钥权限（Mac/Linux）

```bash
# 找到你下载的私钥文件
# 通常在 ~/Downloads/ssh-key-2025-xx-xx.key

# 修改权限（SSH 要求私钥权限必须是 600）
chmod 600 ~/Downloads/ssh-key-2025-xx-xx.key
```

### 步骤 4.2：SSH 连接

```bash
# 格式：ssh -i 私钥路径 ubuntu@服务器IP
ssh -i ~/Downloads/ssh-key-2025-xx-xx.key ubuntu@140.238.xx.xx

# 第一次连接会出现：
# Are you sure you want to continue connecting (yes/no/[fingerprint])?
# 输入 yes 回车

# 成功后看到：
# ubuntu@aishow-server:~$  ← 这就是服务器终端
```

> 💡 后续每次连接只需运行这条命令，不用再输密码

### 步骤 4.3（可选）：简化连接命令

每次都写一长串命令很麻烦，可以配置别名：

```bash
# 在你的本地电脑上（不是服务器）
# 编辑 SSH 配置文件
nano ~/.ssh/config

# 添加以下内容
Host oracle
    HostName 140.238.xx.xx
    User ubuntu
    IdentityFile ~/Downloads/ssh-key-2025-xx-xx.key

# 保存后，以后只需要：
ssh oracle
```

---

## 第五阶段：服务器环境准备

以下命令都在**服务器终端**里执行。

### 步骤 5.1：更新系统

```bash
sudo apt update
sudo apt upgrade -y
# 等待约 2-3 分钟
```

### 步骤 5.2：安装 Docker

```bash
# 一键安装最新版 Docker
curl -fsSL https://get.docker.com | sh

# 把 ubuntu 用户加入 docker 组（避免每次 sudo）
sudo usermod -aG docker ubuntu

# 重新加载组权限
newgrp docker

# 安装 docker compose 插件
sudo apt install docker-compose-plugin -y

# 验证安装
docker --version
# Docker version 26.x.x

docker compose version
# Docker Compose version v2.x.x

# 测试 Docker 正常运行
docker run hello-world
# 看到 "Hello from Docker!" 说明正常
```

### 步骤 5.3：安装 Git 和 Java（构建用）

```bash
# Git（拉取代码）
sudo apt install git -y

# Java 21（构建后端）
sudo apt install openjdk-21-jdk -y

# Maven（构建工具）
sudo apt install maven -y

# Node.js 20（构建前端）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Nginx（Web 服务器）
sudo apt install nginx -y

# 验证全部安装成功
java -version && mvn -version && node -v && nginx -v
```

---

## 第六阶段：部署应用

### 步骤 6.1：克隆代码

```bash
# 在服务器上
git clone https://github.com/SAKURA1175/aishow.git
cd aishow
```

### 步骤 6.2：创建生产配置文件

```bash
# 创建 .env 文件（包含敏感信息，不进 Git）
nano .env
```

粘贴以下内容（**把所有 "你的xxx" 替换为实际值**）：

```bash
# ====== AI 模型 ======
AISHOW_AI_MODEL=deepseek-chat
AISHOW_AI_API_URL=https://api.deepseek.com/v1
AISHOW_AI_API_KEY=sk-你的DeepSeek密钥

# ====== Embedding ======
AISHOW_AI_EMBEDDING_MODEL=BAAI/bge-m3
AISHOW_AI_EMBEDDING_API_URL=https://api.siliconflow.cn/v1
AISHOW_AI_EMBEDDING_API_KEY=sk-你的硅基流动密钥

# ====== 数据库 ======
# 注意：这里用 aishow-mysql（容器名），不是 localhost
AISHOW_JDBC_URL=jdbc:mysql://aishow-mysql:3306/study_ai?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
AISHOW_JDBC_USERNAME=root
AISHOW_JDBC_PASSWORD=设置一个强密码（比如：MyStr0ng@Pass2025）

# ====== Redis ======
AISHOW_REDIS_HOST=redis-aishow
AISHOW_REDIS_PORT=6379

# ====== ChromaDB ======
AISHOW_AI_CHROMA_BASE_URL=http://chroma:8000/api/v2
AISHOW_AI_CHROMA_TENANT=default_tenant
AISHOW_AI_CHROMA_DATABASE=default_database
AISHOW_AI_CHROMA_COLLECTION=study_docs

# ====== 超时配置 ======
AISHOW_AI_API_READ_TIMEOUT_MS=120000
AISHOW_AI_EMBEDDING_READ_TIMEOUT_MS=30000

# ====== Java 配置 ======
AISHOW_JAVA_TOOL_OPTIONS=-Duser.home=/app/data -Dfile.encoding=UTF-8
```

保存（`Ctrl+X` → `Y` → 回车）

### 步骤 6.3：构建后端

```bash
# 在 aishow 目录下
mvn package -DskipTests

# 构建成功后看到：
# BUILD SUCCESS
# 生成文件：target/ssm-spring-ai-study-1.0.0-SNAPSHOT.jar
```

### 步骤 6.4：构建前端

```bash
cd frontend

# 安装依赖
npm install

# 打包（生成静态文件）
npm run build

# 成功后生成：frontend/dist/ 目录
ls dist/
# index.html  assets/

cd ..  # 回到项目根目录
```

### 步骤 6.5：启动所有 Docker 服务

```bash
# 确保在 aishow 目录
docker compose --env-file .env up -d

# 查看启动状态（等30秒）
docker ps

# 所有容器应该是 Up 状态
```

### 步骤 6.6：初始化数据库

```bash
# 读取密码（从 .env 文件）
DB_PASS=$(grep AISHOW_JDBC_PASSWORD .env | cut -d= -f2)

# 等 MySQL 完全启动（看到 healthy）
sleep 15

# 创建数据库
docker exec -i aishow-mysql mysql -uroot -p${DB_PASS} -e \
    "CREATE DATABASE IF NOT EXISTS study_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 建表
docker exec -i aishow-mysql mysql -uroot -p${DB_PASS} study_ai < sql/init.sql
docker exec -i aishow-mysql mysql -uroot -p${DB_PASS} study_ai < sql/resume_module.sql

# 验证
docker exec -it aishow-mysql mysql -uroot -p${DB_PASS} -e "USE study_ai; SHOW TABLES;"
```

### 步骤 6.7：验证后端运行

```bash
curl http://localhost:8090/actuator/health
# 返回：{"status":"UP"} ← 正常

# 如果失败，查看日志
docker logs aishow-backend --tail 30
```

---

## 第七阶段：配置 Nginx

### 步骤 7.1：复制前端文件

```bash
# 把构建好的前端文件复制到 Nginx 目录
sudo cp -r ~/aishow/frontend/dist/* /var/www/html/

# 设置正确的文件权限
sudo chown -R www-data:www-data /var/www/html/
```

### 步骤 7.2：写 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/aishow
```

粘贴以下内容：

```nginx
server {
    listen 80;
    listen [::]:80;

    # 如果你有域名，填域名；没有就填服务器IP
    server_name 140.238.xx.xx;

    # 前端静态文件根目录
    root /var/www/html;
    index index.html;

    # Gzip 压缩（加速前端加载）
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # 前端路由（React SPA 必须这样配，否则刷新页面会 404）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8090/api/;
        proxy_http_version 1.1;

        # 传递真实 IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # SSE 流式推送必须关闭缓冲！
        proxy_buffering off;
        proxy_cache off;

        # 超时时间（AI 生成可能需要较长时间）
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_connect_timeout 10s;

        # SSE 需要这个
        chunked_transfer_encoding on;
    }

    # 安全头
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
}
```

### 步骤 7.3：启用配置

```bash
# 启用 aishow 配置
sudo ln -s /etc/nginx/sites-available/aishow /etc/nginx/sites-enabled/

# 删除默认配置（避免冲突）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置语法
sudo nginx -t
# 必须看到：
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# 重启 Nginx
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx
```

### 步骤 7.4：验证

```bash
# 本地测试（在服务器上）
curl http://localhost/
# 返回 HTML 内容说明成功

curl http://localhost/api/actuator/health
# 返回 {"status":"UP"} 说明 API 代理正常
```

用浏览器访问：`http://你的服务器公网IP`

🎉 看到 Study AI 登录页面，说明部署成功！

---

## 第八阶段：Cloudflare Pages（可选，提速）

如果你想要更快的加载速度和免费 HTTPS，可以把前端部署到 Cloudflare Pages。

### 步骤 8.1：注册 Cloudflare

访问 **https://cloudflare.com** → 「Sign up」→ 邮箱注册（免费）

### 步骤 8.2：修改前端 API 地址

前端需要知道后端 API 的地址。在项目中修改 `frontend/vite.config.js`：

```javascript
// 开发时代理到本地
// 生产时需要通过环境变量指定服务器地址
```

更简单的方案：在 `frontend/.env.production` 创建文件：

```bash
nano frontend/.env.production
```

内容：
```
VITE_API_BASE_URL=http://你的Oracle服务器公网IP:8090
```

然后修改 `frontend/src/api/` 下的所有 axios 请求，使用这个环境变量作为 baseURL。

### 步骤 8.3：创建 Cloudflare Pages 项目

1. 登录 Cloudflare Dashboard
2. 左侧菜单 → **Workers & Pages**
3. 点「**Create**」→ 选「**Pages**」
4. 选「**Connect to Git**」
5. 授权连接 GitHub，选择 `aishow` 仓库
6. 配置构建：

| 设置项 | 值 |
|---|---|
| Production branch | `main` |
| Build command | `cd frontend && npm install && npm run build` |
| Build output directory | `frontend/dist` |

7. 点「**Save and Deploy**」

### 步骤 8.4：等待首次构建

约 2-3 分钟后，Cloudflare 给你一个免费域名：

`aishow-xxx.pages.dev`

以后每次 `git push` 都会自动重新部署前端。

---

## 第九阶段：初始化知识库

服务都跑起来后，初始化知识库：

```bash
# 在服务器上（确保后端已运行）
cd ~/aishow/kb_data

# 安装 Python（通常已有）
python3 --version

# 初始化主知识库
python3 scrape_and_import.py

# 初始化简历知识库
python3 resume_kb_init.py
```

---

## 常用维护命令

```bash
# 查看所有容器状态
docker ps

# 查看后端日志（实时）
docker logs aishow-backend -f --tail 100

# 重启某个服务
docker restart aishow-backend

# 更新代码并重新部署后端
cd ~/aishow
git pull
mvn package -DskipTests
docker cp target/ssm-spring-ai-study-1.0.0-SNAPSHOT.jar aishow-backend:/app/app.jar
docker restart aishow-backend

# 更新前端
cd ~/aishow/frontend
npm run build
sudo cp -r dist/* /var/www/html/

# 备份数据库
DB_PASS=$(grep AISHOW_JDBC_PASSWORD ~/aishow/.env | cut -d= -f2)
docker exec aishow-mysql mysqldump -uroot -p${DB_PASS} study_ai > backup_$(date +%Y%m%d).sql

# 查看磁盘使用
df -h
docker system df
```

---

*下一篇：[06-troubleshooting.md](./06-troubleshooting.md)*
