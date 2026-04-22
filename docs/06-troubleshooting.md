# Study AI · 常见问题排查

> 按症状分类的详细排查指南

---

## 类型一：启动失败

### 问题：后端启动报 `No default constructor found`

**错误信息：**
```
BeanCreationException: Failed to instantiate [ChromaVectorStore]:
No default constructor found
```

**原因：** Spring 不知道要用哪个构造器注入依赖。

**解决：** 确认 `ChromaVectorStore.java` 的主构造器有 `@Autowired` 注解：
```java
@Autowired
public ChromaVectorStore(AiProperties aiProperties) { ... }
```

---

### 问题：后端启动报数据库连接失败

**错误信息：**
```
Communications link failure
The last packet sent successfully to the server was X milliseconds ago
```

**排查步骤：**
```bash
# 1. 确认 MySQL 容器在运行
docker ps | grep mysql
# 看到 aishow-mysql  Up (healthy) 才正常

# 2. 如果容器没起来，查看原因
docker logs aishow-mysql

# 3. 手动测试连接
docker exec -it aishow-mysql mysql -uroot -p1234
# 能进去说明 MySQL 正常

# 4. 检查 db.properties 配置
cat src/main/resources/db.properties
# 确认 host、端口、用户名、密码正确
```

---

### 问题：后端启动报端口占用

**错误信息：**
```
Web server failed to start. Port 8090 was already in use.
```

**解决：**
```bash
# Mac/Linux 查找占用 8090 端口的进程
lsof -i :8090

# 看到类似：
# java  12345  username  ...

# 杀掉这个进程
kill -9 12345

# 重新启动后端
mvn spring-boot:run
```

---

### 问题：前端启动报 `npm install` 失败

**错误信息：**
```
npm ERR! network request failed
```

**解决：**
```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com

# 清除缓存
npm cache clean --force

# 删除已有的 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

---

## 类型二：AI 功能异常

### 问题：AI 不回答，显示空白或超时

**排查步骤：**

```bash
# 1. 检查 AI API Key 是否正确
cat src/main/resources/redis.properties | grep ai.api

# 2. 手动测试 API 是否可达
curl -s https://api.deepseek.com/v1/models \
  -H "Authorization: Bearer sk-你的key" \
  | head -c 200
# 返回模型列表说明 Key 有效

# 3. 查看后端日志的报错
docker logs aishow-backend --tail 50 | grep ERROR

# 4. 常见原因：
# - API Key 错误或余额不足
# - API 服务临时不可用（重试即可）
# - 超时时间太短（调大 ai.api.read-timeout-ms）
```

**余额不足的表现：**
```
Error: Insufficient balance
# 去充值后重试
```

---

### 问题：第一次问是空的，第二次才有回答

**原因：** 这是 SSE 流式推送的初始化问题，Session 未完全建立。

**已修复**：确认代码是最新版本 `git pull`。

如果还有问题：
```bash
# 查看是否有深度思考相关的初始化日志
docker logs aishow-backend | grep "deepThink\|DeepThink"
```

---

### 问题：AI 回答不了联网问题，说"无法获取实时信息"

**原因：** SearxNG 服务不可用。

**排查：**
```bash
# 1. 确认 SearxNG 容器运行
docker ps | grep searxng

# 2. 测试 SearxNG 是否正常
curl "http://localhost:8081/search?q=test&format=json"
# 返回 JSON 结果说明正常

# 3. 如果容器没起来
docker logs aishow-searxng
docker restart aishow-searxng
```

---

### 问题：知识库检索没有结果，AI 不参考文档内容

**排查：**
```bash
# 1. 确认 ChromaDB 运行
curl http://localhost:8000/api/v2/heartbeat
# 返回 {"nanosecond heartbeat": xxx} 说明正常

# 2. 检查是否有文档被向量化
curl "http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections" \
  -s | python3 -m json.tool
# 应该看到 study_docs collection

# 3. 查看 collection 中的文档数量
curl "http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections/study_docs/count"

# 4. 如果文档数是 0，需要重新上传文档
```

**Embedding 失败排查：**
```bash
# 查看向量化日志
docker logs aishow-backend | grep -i "embed\|chroma\|vector"

# 手动测试 Embedding API
curl https://api.siliconflow.cn/v1/embeddings \
  -H "Authorization: Bearer sk-你的key" \
  -H "Content-Type: application/json" \
  -d '{"model":"BAAI/bge-m3","input":"test"}' \
  -s | head -c 200
# 返回 JSON 说明 Key 有效
```

---

## 类型三：部署问题

### 问题：服务器上 curl 到 8090 没有响应

**排查步骤：**
```bash
# 1. 确认后端容器在运行
docker ps | grep backend

# 2. 查看容器日志
docker logs aishow-backend --tail 50

# 3. 在容器内部测试
docker exec aishow-backend wget -qO- http://localhost:8090/actuator/health

# 4. 检查端口绑定
ss -tlnp | grep 8090
```

---

### 问题：Nginx 报 502 Bad Gateway

**原因：** Nginx 无法连接到后端 8090 端口。

**排查：**
```bash
# 1. 确认后端在运行
curl http://localhost:8090/actuator/health

# 2. 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 3. 检查 Nginx 配置
sudo nginx -t

# 4. 重启
sudo systemctl restart nginx
```

---

### 问题：Nginx 配置后 SSE 不工作（AI 一次性返回，不是逐字）

**原因：** Nginx 默认会缓冲响应，必须关闭。

**确认配置：**
```bash
sudo cat /etc/nginx/sites-available/aishow | grep buffering
# 必须有：proxy_buffering off;
```

如果没有，编辑添加：
```nginx
location /api/ {
    proxy_pass http://localhost:8090/api/;
    proxy_buffering off;      # ← 必须有这一行！
    proxy_cache off;          # ← 最好也加这一行
    proxy_read_timeout 300s;
    chunked_transfer_encoding on;
}
```

---

### 问题：Oracle Cloud 服务器外网无法访问

**排查清单：**
```bash
# 1. 检查 Oracle 安全组（在控制台网页操作）
# Instance → Primary VNIC → Subnet → Security Lists
# 确认有 0.0.0.0/0 TCP 80 的 Ingress 规则

# 2. 检查服务器内部防火墙
sudo iptables -L INPUT -n | grep -E "80|443"
# 应该看到 ACCEPT 规则

# 3. 如果没有，手动添加
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT

# 4. 检查 Nginx 是否在监听
ss -tlnp | grep nginx
# 应该看到 :80 和 :443

# 5. 查看 Nginx 是否有错误
sudo systemctl status nginx
sudo journalctl -u nginx --tail 20
```

---

### 问题：代码更新后，后端还是旧版本

```bash
# 正确的更新流程
cd ~/aishow

# 1. 拉取最新代码
git pull

# 2. 重新构建
mvn package -DskipTests

# 3. 把新 jar 复制进容器
docker cp target/ssm-spring-ai-study-1.0.0-SNAPSHOT.jar aishow-backend:/app/app.jar

# 4. 重启容器
docker restart aishow-backend

# 5. 等待启动（约20秒）
sleep 25

# 6. 验证
curl http://localhost:8090/actuator/health
```

---

## 类型四：性能问题

### 问题：AI 回答很慢

**可能原因：**

| 原因 | 判断方法 | 解决 |
|---|---|---|
| 网络延迟高（服务器到AI API距离远）| ping api.deepseek.com | 换 Tokyo 节点或换 API 服务商 |
| AI 模型太大 | 看日志响应时间 | 换更快的模型（如 deepseek-chat 换 deepseek-v3）|
| 历史消息太多 | 检查 token 数 | 降低 max-history-messages |
| 服务器 CPU 负载高 | htop | 减少并发或升级配置 |

---

### 问题：上传文档后向量化很慢

**原因：** Embedding API 的响应速度。

**解决：**
```bash
# 使用更快的 Embedding API
# 硅基流动通常够快，如果慢检查网络：
ping api.siliconflow.cn

# 检查 Embedding 超时配置
cat src/main/resources/redis.properties | grep embedding.read-timeout
# 调大这个值
```

---

## 快速诊断命令汇总

```bash
# 一键检查所有服务状态
echo "=== Docker 容器状态 ===" && docker ps --format "table {{.Names}}\t{{.Status}}"
echo "=== 后端健康检查 ===" && curl -s http://localhost:8090/actuator/health
echo "=== ChromaDB 检查 ===" && curl -s http://localhost:8000/api/v2/heartbeat
echo "=== Nginx 状态 ===" && sudo systemctl is-active nginx
echo "=== 磁盘使用 ===" && df -h / | tail -1
echo "=== 内存使用 ===" && free -h | grep Mem
```

---

*下一篇：[07-config-reference.md](./07-config-reference.md)*
