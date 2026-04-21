#!/usr/bin/env python3
"""
简历知识库爬虫 - 导入到 resume_kb ChromaDB collection
数据源：GitHub 简历指南 + 内置高质量知识条目
"""
import urllib.request, urllib.parse, json, os, re, time, http.cookiejar

BACKEND = "http://localhost:8090"
COOKIE_JAR = http.cookiejar.CookieJar()
OPENER = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(COOKIE_JAR))
OPENER.addheaders = [('User-Agent', 'Mozilla/5.0 (compatible; StudyAI/1.0)')]
urllib.request.install_opener(OPENER)

# ── 内置知识条目（高质量，不依赖爬虫）────────────────────────────────────────
BUILTIN_KNOWLEDGE = [
    {
        "id": "resume_star_method",
        "title": "STAR 法则 - 简历项目经历写作方法",
        "content": """# STAR 法则 - 简历项目经历写作黄金标准

STAR 法则是描述项目经历最有效的结构化写作方法，被顶级大厂 HR 一致推荐。

## 四要素

- **S (Situation) 背景**：描述项目的背景、规模、面临的问题
- **T (Task) 任务**：你在项目中承担的具体职责
- **A (Action) 行动**：你采取了哪些具体行动，用了什么技术方案
- **R (Result) 结果**：取得了什么可量化的成果

## 示例对比

❌ 差的写法：
"参与开发了公司的电商系统，负责后端开发工作。"

✅ 好的写法（STAR）：
"负责电商平台订单系统重构（T），针对高并发场景下数据库性能瓶颈（S），引入 Redis 分布式锁和消息队列异步处理方案（A），将系统 QPS 从 500 提升至 3000+，订单处理延迟降低 80%（R）。"

## 常见错误

1. 只有行动没有结果：缺少量化数据
2. 只有结果没有行动：HR 无法判断你的贡献
3. 描述过于模糊：用"参与""协助"等弱化词汇
4. 堆砌技术名词：没有说明为什么选择该技术

## 量化结果的常用维度

- 性能提升：响应时间减少X%，QPS提升X倍
- 效率提升：开发效率提升X%，部署时间缩短X分钟
- 规模指标：支持X万用户，处理X万条/天
- 业务价值：节省成本X万，用户留存提升X%
"""
    },
    {
        "id": "resume_structure_guide",
        "title": "技术岗简历结构指南",
        "content": """# 技术岗简历结构指南

## 推荐模块顺序

1. **基本信息**（必须）：姓名、电话、邮箱、GitHub、目标岗位
2. **教育经历**（必须）：学校、专业、学位、GPA（可选）
3. **专业技能**（必须）：编程语言、框架、工具、数据库
4. **项目经历**（核心）：2-4个项目，每个用STAR法则
5. **工作/实习经历**（有则必填）
6. **开源贡献/个人项目**（加分项）
7. **获奖荣誉**（可选）
8. **自我评价**（慎重，容易写烂）

## 各模块写作要点

### 基本信息
- GitHub 主页必填（展示代码能力）
- 避免填写年龄、照片、婚姻状态（无关信息）
- 目标岗位要明确：Java后端工程师 优于 程序员

### 专业技能
- 按熟练度分层：熟练掌握 / 掌握 / 了解
- 避免"精通"二字，除非真的精通
- 示例格式：
  - 熟练掌握：Java、Spring Boot、MySQL、Redis
  - 掌握：React、Docker、Kubernetes、消息队列
  - 了解：Golang、机器学习基础

### 项目经历
- 2个强项目 > 5个平庸项目
- 必须有技术选型理由
- 必须有量化结果
- GitHub 链接加分

## 简历长度
- 应届生：1页最佳，最多1.5页
- 1-3年经验：1-2页
- 3年以上：2页内

## 字体格式
- 中文推荐：微软雅黑或思源黑体
- 英文推荐：Calibri 或 Arial
- 正文字号：10-11pt
- 行间距：1.2-1.5倍
"""
    },
    {
        "id": "resume_skills_keywords",
        "title": "后端工程师简历技术关键词库",
        "content": """# 后端工程师技术关键词库

## 编程语言
Java、Python、Go、C++、Kotlin、Scala、Rust

## 主流框架
- Java系：Spring Boot、Spring Cloud、MyBatis、MyBatis-Plus、Netty、Dubbo、gRPC
- Python系：FastAPI、Django、Flask
- Go系：Gin、Echo、Fiber

## 数据库
- 关系型：MySQL、PostgreSQL、Oracle
- 缓存：Redis、Memcached
- 文档型：MongoDB、Elasticsearch
- 向量数据库：Milvus、ChromaDB、Weaviate、Pinecone

## 消息队列
Kafka、RocketMQ、RabbitMQ、Pulsar

## 微服务 & 云原生
Spring Cloud、Nacos、Sentinel、Seata、Docker、Kubernetes、Helm、Istio、Service Mesh

## 大数据
Hadoop、Spark、Flink、Hive、Presto、ClickHouse、数据湖

## AI/LLM
Spring AI、LangChain、LlamaIndex、RAG、向量检索、Embedding、Fine-tuning、Prompt Engineering

## DevOps
Jenkins、GitHub Actions、GitLab CI、Prometheus、Grafana、ELK Stack、Jaeger

## 设计能力
- 高并发：分布式锁、限流、熔断、降级
- 高可用：主从复制、分库分表、读写分离
- 高性能：索引优化、SQL调优、缓存设计

## 面试高频考点关键词（写项目时融入）
线程安全、事务管理、JVM调优、GC优化、内存泄漏排查、死锁定位
"""
    },
    {
        "id": "resume_quantification_guide",
        "title": "简历数据量化指南",
        "content": """# 简历数据量化指南

## 为什么要量化

量化数据让你的成就从抽象变具体，让 HR 和技术面试官能快速判断你的能力级别。
"提升了性能" vs "P99延迟从800ms降至120ms" —— 后者胜出。

## 可量化的维度

### 性能指标
- 响应时间：P50/P99延迟、平均响应时间
- 吞吐量：QPS（每秒请求数）、TPS（每秒事务数）
- 资源占用：CPU使用率、内存占用、带宽

### 规模指标
- 用户规模：DAU（日活）、MAU（月活）、注册用户数
- 数据规模：数据量（TB级）、日增量、处理条数/天
- 服务规模：节点数、集群规模、微服务数量

### 效率指标
- 开发效率：需求交付周期缩短X%
- 运维效率：故障恢复时间（MTTR）
- 构建时间：CI/CD流水线时间

### 业务指标
- 转化率提升
- 用户留存率
- 错误率降低

## 没有数据怎么办

1. 回忆项目规模：这个系统有多少用户？数据量多少？
2. 对比前后：改造前是什么状态？改造后是什么？
3. 估算：通过日志、监控工具追溯数据
4. 使用范围：如果不确定精确数字，用"约"或范围："约10万DAU"

## 示例

❌ "优化了数据库查询"
✅ "通过添加复合索引并重写SQL，将用户列表查询从2.3s优化至80ms，降低95%"

❌ "系统稳定运行"
✅ "系统SLA达到99.9%，成功支撑双十一峰值5000 QPS"
"""
    },
    {
        "id": "resume_common_mistakes",
        "title": "简历常见错误及修改建议",
        "content": """# 简历常见错误及修改建议

## 1. 使用弱化动词

❌ 弱化：参与、协助、帮助、负责、接触过
✅ 强化：主导、设计、实现、优化、重构、搭建、架构

## 2. 自我评价废话连篇

❌ "本人性格开朗，工作认真负责，具有良好的团队协作精神，能承受工作压力..."
✅ 直接删掉自我评价，用项目成果说话

## 3. 技能写"精通"

❌ "精通 Java、精通 Spring Boot、精通 MySQL"
✅ "熟练掌握 Java（6年）、Spring Boot 生态"
（只有极少数人可以称精通）

## 4. 项目描述只有技术栈

❌ "使用 Spring Boot + MySQL + Redis 开发了一个电商系统"
✅ 用STAR法则完整描述，加入技术选型理由和量化结果

## 5. 时间线混乱

- 时间格式统一：2022.09 - 2023.06 或 2022/09 - 2023/06
- 按时间倒序排列（最新的在最前）
- 在读/在职写"至今"

## 6. 格式问题

- 中英文之间不加空格：Java开发 → Java 开发
- 使用 Word 导出的 PDF 格式混乱
- 推荐使用 LaTeX 或专业简历工具（Canva、超级简历）

## 7. 联系方式不全

- 必须有：手机、邮箱
- 加分项：GitHub、个人博客/掘金主页、LinkedIn

## 8. 简历命名不专业

❌ "简历.pdf"、"resume_final_v3_修改.pdf"
✅ "张三_Java后端_2025届.pdf"
"""
    },
    {
        "id": "resume_github_tips",
        "title": "GitHub 主页优化指南",
        "content": """# GitHub 主页优化指南

GitHub 是技术简历最强的加分项，好的 GitHub 主页能让你脱颖而出。

## Profile README 优化

创建与用户名同名的仓库（如 username/username），添加 README.md：

推荐内容：
- 技术栈图标（使用 shields.io 徽章）
- GitHub Stats 统计卡片
- 近期项目简介
- 联系方式

## 仓库展示技巧

1. **置顶6个最佳项目**：选择代码质量高、有README的仓库
2. **每个仓库必须有 README**：包含项目介绍、技术栈、安装方法、截图
3. **保持活跃度**：绿色贡献图能体现持续学习的态度
4. **项目分类**：工作项目（脱敏）、学习项目、开源贡献

## README 模板

```markdown
# 项目名称

> 一句话描述项目

## 技术栈
- 后端：Spring Boot 3 + MyBatis-Plus
- 数据库：MySQL 8 + Redis 7
- 部署：Docker + Nginx

## 核心功能
- [ ] 功能一
- [ ] 功能二

## 快速启动
```bash
docker-compose up -d
```

## 效果截图
[截图]
```

## 开源贡献

参与知名开源项目是最强的简历加分项：
- 修复 Bug（从 good first issue 开始）
- 补充文档
- 提交 PR 被合并即可写入简历

推荐项目：Spring Boot、MyBatis、Hutool、Sa-Token 等国内活跃项目
"""
    },
    {
        "id": "resume_interview_prep",
        "title": "简历驱动的面试准备",
        "content": """# 简历驱动的面试准备

## 核心原则

简历上写的每一个技术点，都要做好被深挖3层的准备。

## STAR 故事库

针对简历上的每个项目，准备以下问题的完整回答：

1. 介绍一下这个项目
2. 你在项目中的角色和贡献是什么？
3. 遇到了哪些技术难点？如何解决的？
4. 项目最终取得了什么效果？
5. 如果重新做这个项目，你会有哪些改进？

## 技术深挖准备

如果简历写了"Redis实现分布式锁"，要准备：
- 为什么用Redis而不是数据库实现？
- Redis分布式锁的实现原理？
- SETNX和SET NX EX的区别？
- 如果Redis主节点宕机怎么办？（RedLock）
- 锁超时但业务未执行完怎么处理？（看门狗）

## 项目介绍话术模板

"我来介绍一下[项目名称]。这是一个[业务场景]的系统，主要解决[核心问题]。
我在其中负责[你的角色]，核心工作是[主要技术工作]。
我们采用了[关键技术方案]，最终[量化成果]。
整个项目让我对[技术领域]有了更深入的理解。"

## 简历和面试的一致性

- 简历中的技术必须真实掌握
- 项目数据必须真实（面试官会追问细节）
- 不要写"了解"的技术，避免被深挖

## HR面试常见问题准备

1. 为什么选择我们公司？（研究公司业务+技术栈）
2. 职业规划？（3年内在某技术领域深耕）
3. 期望薪资？（调研市场行情+预留谈判空间）
4. 最大的优缺点？（缺点要说可改进的、非致命的）
"""
    },
    {
        "id": "resume_template_backend",
        "title": "Java后端工程师简历模板",
        "content": """# Java后端工程师简历模板

---

## 张三
📧 zhangsan@email.com | 📱 138-xxxx-xxxx | 🐙 github.com/zhangsan
目标岗位：Java后端开发工程师（2025届）

---

## 教育经历

**xx大学** | 计算机科学与技术 | 本科 | 2021.09 - 2025.06
- GPA：3.8/4.0（专业前10%）
- 核心课程：数据结构、操作系统、计算机网络、数据库原理

---

## 专业技能

- **熟练掌握**：Java（4年）、Spring Boot、Spring Cloud、MyBatis-Plus、MySQL
- **掌握**：Redis、Kafka、Docker、Kubernetes、Elasticsearch、Linux
- **了解**：Golang、Python、Vue3、LLM应用开发（RAG、Prompt Engineering）
- **工具**：Git、Maven、IntelliJ IDEA、Postman、Prometheus+Grafana

---

## 项目经历

### Study AI - AI学业辅助平台 | 个人项目 | 2024.06 - 至今

**项目背景**：基于RAG技术的智能问答系统，支持文档知识库检索和AI对话。

**技术栈**：Spring Boot 3 + React 18 + ChromaDB + BGE-M3 + Docker

**主要工作**：
- 设计并实现RAG检索管道，集成BGE-M3嵌入模型和ChromaDB向量数据库（T）
- 针对向量检索精度不足的问题，引入混合检索（向量+BM25）策略（A）
- 搭建SSE流式推送机制，实现逐字符实时响应，提升用户体验（A）
- 实现多会话管理、对话历史截断和角色权限隔离（A）

**项目成果**：
- 知识库检索准确率达85%+，支持10+用户同时在线
- GitHub获得50+ Star，已Docker化部署

---

## 获奖经历

- 2024年 xx大学程序设计竞赛 一等奖
- 2023年 蓝桥杯Java组 省级二等奖

---

## 自我评价

扎实的计算机基础，热爱开源，积极参与技术社区。有独立完成全栈项目的经验，对高并发系统设计有浓厚兴趣。

---
"""
    },
]

# ── GitHub 简历相关 README ────────────────────────────────────────────────────
GITHUB_SOURCES = [
    ("resume_tips_awesome", "https://raw.githubusercontent.com/resumejob/awesome-resume/master/README.md"),
    ("interview_guide",     "https://raw.githubusercontent.com/CyC2018/CS-Notes/master/README.md"),
]

def fetch_url(url, timeout=15):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.read().decode('utf-8', errors='replace')
    except Exception as e:
        print(f"  ❌ 请求失败: {e}")
        return None

def clean_text(text):
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    text = re.sub(r'[ \t]+\n', '\n', text)
    return text.strip()

def login():
    print("🔑 登录后台...")
    data = json.dumps({"username": "testteacher", "password": "123456", "role": "teacher"}).encode()
    req = urllib.request.Request(
        f"{BACKEND}/api/user/login",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        resp = json.loads(r.read())
    if resp.get("success"):
        print("  ✅ 登录成功")
        return True
    print(f"  ❌ 登录失败: {resp}")
    return False

def import_entry(entry_id, title, content):
    """调用 /api/resume/kb/import 写入简历知识库"""
    payload = json.dumps({"id": entry_id, "title": title, "content": content}).encode()
    req = urllib.request.Request(
        f"{BACKEND}/api/resume/kb/import",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read())
        if resp.get("success"):
            print(f"  ✅ 写入: {title[:40]}")
            return True
        else:
            print(f"  ❌ 写入失败: {resp.get('message')}")
            return False
    except Exception as e:
        print(f"  ❌ 请求失败: {e}")
        return False

def split_chunks(text, chunk_size=800, overlap=100):
    """将长文本分块，避免单条过长影响检索质量"""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def main():
    print("🎯 简历知识库初始化脚本")
    print("=" * 50)

    if not login():
        print("登录失败，退出")
        return

    total_ok = 0
    total_fail = 0

    # 1. 导入内置知识条目
    print(f"\n📚 导入内置知识条目（{len(BUILTIN_KNOWLEDGE)} 条）...")
    for entry in BUILTIN_KNOWLEDGE:
        content = entry["content"]
        # 长文本分块
        if len(content) > 1000:
            chunks = split_chunks(content)
            for i, chunk in enumerate(chunks):
                chunk_id = f"{entry['id']}_chunk{i}"
                chunk_title = f"{entry['title']} (第{i+1}部分)"
                ok = import_entry(chunk_id, chunk_title, chunk)
                if ok: total_ok += 1
                else:  total_fail += 1
                time.sleep(0.3)
        else:
            ok = import_entry(entry["id"], entry["title"], content)
            if ok: total_ok += 1
            else:  total_fail += 1
            time.sleep(0.3)

    # 2. 爬取 GitHub 数据源
    print(f"\n🐙 爬取 GitHub 数据源（{len(GITHUB_SOURCES)} 个）...")
    for name, url in GITHUB_SOURCES:
        print(f"  → {url}")
        content = fetch_url(url)
        if not content or len(content) < 200:
            print(f"  ⚠️  获取失败，跳过")
            continue
        content = clean_text(content)
        chunks = split_chunks(content[:8000])  # 只取前8000字
        for i, chunk in enumerate(chunks):
            ok = import_entry(f"{name}_chunk{i}", f"GitHub: {name} (第{i+1}部分)", chunk)
            if ok: total_ok += 1
            else:  total_fail += 1
            time.sleep(0.5)

    print(f"\n{'='*50}")
    print(f"✅ 完成！成功: {total_ok} 条  失败: {total_fail} 条")
    print(f"简历知识库 (resume_kb) 已就绪，共 {total_ok} 个知识片段")
    print(f"\n后续可通过管理后台或追加运行此脚本来添加更多内容。")

if __name__ == "__main__":
    main()
