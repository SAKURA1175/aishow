#!/usr/bin/env python3
"""
官方文档爬取 + 知识库导入
来源：
  - Spring 官方 GitHub（文档 Markdown）
  - Python 官方 docs.python.org（静态 HTML）
  - Anthropic Claude 官方 GitHub
  - OpenAI 官方 GitHub
  - AI 框架官方仓库（LangChain/LangGraph/AutoGen/CrewAI/Ollama 等）
  - 计算机基础官方仓库（Redis/Docker/Git/FastAPI/Django/Vue/React）
"""

import requests, os, time, glob, json, re
from bs4 import BeautifulSoup

BACKEND  = "http://localhost:8090"
KB_DIR   = "/Users/superserver/Desktop/work/aishow/kb_data/official_docs"
BATCH    = 6
os.makedirs(KB_DIR, exist_ok=True)

sess = requests.Session()
sess.trust_env = False
sess.headers.update({"User-Agent": "Mozilla/5.0 StudyAI-DocBot/2.0"})

# ─── GitHub Raw Markdown 文档 ─────────────────────────────────────────────────
GITHUB_DOCS = [
    # Spring 生态
    ("spring_framework",      "https://raw.githubusercontent.com/spring-projects/spring-framework/main/README.md"),
    ("spring_boot",           "https://raw.githubusercontent.com/spring-projects/spring-boot/main/README.adoc"),
    ("spring_ai",             "https://raw.githubusercontent.com/spring-projects/spring-ai/main/README.md"),
    ("spring_security",       "https://raw.githubusercontent.com/spring-projects/spring-security/main/README.adoc"),
    ("spring_data",           "https://raw.githubusercontent.com/spring-projects/spring-data-commons/main/README.adoc"),
    ("spring_cloud",          "https://raw.githubusercontent.com/spring-cloud/spring-cloud-commons/main/README.adoc"),
    ("mybatis",               "https://raw.githubusercontent.com/mybatis/mybatis-3/master/README.md"),
    ("mybatis_spring_boot",   "https://raw.githubusercontent.com/mybatis/mybatis-spring-boot/master/README.md"),

    # OpenAI / ChatGPT
    ("openai_python_sdk",     "https://raw.githubusercontent.com/openai/openai-python/main/README.md"),
    ("openai_node_sdk",       "https://raw.githubusercontent.com/openai/openai-node/master/README.md"),
    ("openai_cookbook_full",  "https://raw.githubusercontent.com/openai/openai-cookbook/main/README.md"),
    ("openai_realtime",       "https://raw.githubusercontent.com/openai/openai-realtime-api-beta/main/README.md"),

    # Anthropic Claude
    ("anthropic_python_sdk",  "https://raw.githubusercontent.com/anthropics/anthropic-sdk-python/main/README.md"),
    ("anthropic_js_sdk",      "https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/README.md"),
    ("anthropic_quickstart",  "https://raw.githubusercontent.com/anthropics/anthropic-quickstarts/main/README.md"),

    # LangChain 生态
    ("langchain_core",        "https://raw.githubusercontent.com/langchain-ai/langchain/master/libs/langchain/README.md"),
    ("langchain_community",   "https://raw.githubusercontent.com/langchain-ai/langchain/master/libs/community/README.md"),
    ("langgraph",             "https://raw.githubusercontent.com/langchain-ai/langgraph/main/README.md"),
    ("langsmith",             "https://raw.githubusercontent.com/langchain-ai/langsmith-sdk/main/python/README.md"),

    # 其他 AI 框架
    ("huggingface_transformers","https://raw.githubusercontent.com/huggingface/transformers/main/README.md"),
    ("huggingface_diffusers", "https://raw.githubusercontent.com/huggingface/diffusers/main/README.md"),
    ("ollama",                "https://raw.githubusercontent.com/ollama/ollama/main/README.md"),
    ("autogen",               "https://raw.githubusercontent.com/microsoft/autogen/main/README.md"),
    ("crewai",                "https://raw.githubusercontent.com/crewAIInc/crewAI/main/README.md"),
    ("semantic_kernel",       "https://raw.githubusercontent.com/microsoft/semantic-kernel/main/README.md"),
    ("llama_index",           "https://raw.githubusercontent.com/run-llama/llama_index/main/README.md"),
    ("dspy",                  "https://raw.githubusercontent.com/stanfordnlp/dspy/main/README.md"),
    ("vllm",                  "https://raw.githubusercontent.com/vllm-project/vllm/main/README.md"),
    ("chroma_db",             "https://raw.githubusercontent.com/chroma-core/chroma/main/README.md"),
    ("milvus",                "https://raw.githubusercontent.com/milvus-io/milvus/master/README.md"),
    ("qdrant",                "https://raw.githubusercontent.com/qdrant/qdrant/master/README.md"),

    # Python Web 框架
    ("fastapi",               "https://raw.githubusercontent.com/tiangolo/fastapi/master/README.md"),
    ("django",                "https://raw.githubusercontent.com/django/django/main/README.rst"),
    ("flask",                 "https://raw.githubusercontent.com/pallets/flask/main/README.rst"),
    ("pydantic",              "https://raw.githubusercontent.com/pydantic/pydantic/main/README.md"),
    ("sqlalchemy",            "https://raw.githubusercontent.com/sqlalchemy/sqlalchemy/main/README.rst"),

    # 前端
    ("react",                 "https://raw.githubusercontent.com/facebook/react/main/README.md"),
    ("vue",                   "https://raw.githubusercontent.com/vuejs/core/main/README.md"),
    ("vite",                  "https://raw.githubusercontent.com/vitejs/vite/main/README.md"),
    ("nextjs",                "https://raw.githubusercontent.com/vercel/next.js/canary/README.md"),
    ("tailwindcss",           "https://raw.githubusercontent.com/tailwindlabs/tailwindcss/master/README.md"),

    # 数据库 / 基础设施
    ("redis_official",        "https://raw.githubusercontent.com/redis/redis/unstable/README.md"),
    ("postgresql_wiki",       "https://raw.githubusercontent.com/postgres/postgres/master/README"),
    ("mysql_connector",       "https://raw.githubusercontent.com/mysql/mysql-connector-python/trunk/README.txt"),
    ("docker_compose",        "https://raw.githubusercontent.com/docker/compose/main/README.md"),
    ("kubernetes_official",   "https://raw.githubusercontent.com/kubernetes/kubernetes/master/README.md"),
    ("nginx",                 "https://raw.githubusercontent.com/nginx/nginx/master/README"),
    ("kafka",                 "https://raw.githubusercontent.com/apache/kafka/trunk/README.md"),
    ("rabbitmq",              "https://raw.githubusercontent.com/rabbitmq/rabbitmq-server/main/README.md"),

    # 工具链
    ("git_official",          "https://raw.githubusercontent.com/git/git/master/README"),
    ("gradle",                "https://raw.githubusercontent.com/gradle/gradle/master/README.md"),
    ("maven_wrapper",         "https://raw.githubusercontent.com/takari/maven-wrapper/master/README.adoc"),
    ("pytest",                "https://raw.githubusercontent.com/pytest-dev/pytest/main/README.rst"),
    ("jupyter",               "https://raw.githubusercontent.com/jupyter/notebook/main/README.md"),

    # 安全 / 网络
    ("jwt_io",                "https://raw.githubusercontent.com/auth0/node-jsonwebtoken/master/README.md"),
    ("oauth2_server",         "https://raw.githubusercontent.com/spring-projects/spring-authorization-server/main/README.adoc"),

    # 系统设计
    ("system_design_primer",  "https://raw.githubusercontent.com/donnemartin/system-design-primer/master/README.md"),
    ("awesome_java",          "https://raw.githubusercontent.com/akullpp/awesome-java/master/README.md"),
    ("awesome_python2",       "https://raw.githubusercontent.com/vinta/awesome-python/master/README.md"),
    ("tech_interview",        "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/readme.md"),
]

# ─── Python 官方文档（静态 HTML）─────────────────────────────────────────────
PYTHON_DOCS = [
    ("python_tutorial_intro",      "https://docs.python.org/3/tutorial/introduction.html"),
    ("python_tutorial_control",    "https://docs.python.org/3/tutorial/controlflow.html"),
    ("python_tutorial_ds",         "https://docs.python.org/3/tutorial/datastructures.html"),
    ("python_tutorial_modules",    "https://docs.python.org/3/tutorial/modules.html"),
    ("python_tutorial_io",         "https://docs.python.org/3/tutorial/inputoutput.html"),
    ("python_tutorial_errors",     "https://docs.python.org/3/tutorial/errors.html"),
    ("python_tutorial_classes",    "https://docs.python.org/3/tutorial/classes.html"),
    ("python_tutorial_stdlib",     "https://docs.python.org/3/tutorial/stdlib.html"),
    ("python_tutorial_stdlib2",    "https://docs.python.org/3/tutorial/stdlib2.html"),
    ("python_asyncio",             "https://docs.python.org/3/library/asyncio.html"),
    ("python_typing",              "https://docs.python.org/3/library/typing.html"),
    ("python_dataclasses",         "https://docs.python.org/3/library/dataclasses.html"),
    ("python_pathlib",             "https://docs.python.org/3/library/pathlib.html"),
    ("python_collections",         "https://docs.python.org/3/library/collections.html"),
    ("python_functools",           "https://docs.python.org/3/library/functools.html"),
    ("python_itertools",           "https://docs.python.org/3/library/itertools.html"),
    ("python_logging",             "https://docs.python.org/3/library/logging.html"),
    ("python_unittest",            "https://docs.python.org/3/library/unittest.html"),
    ("python_threading",           "https://docs.python.org/3/library/threading.html"),
    ("python_multiprocessing",     "https://docs.python.org/3/library/multiprocessing.html"),
    ("python_json",                "https://docs.python.org/3/library/json.html"),
    ("python_re",                  "https://docs.python.org/3/library/re.html"),
    ("python_decorators_howto",    "https://docs.python.org/3/howto/descriptor.html"),
]

# ─── Spring 官方文档页面（静态 HTML）─────────────────────────────────────────
SPRING_HTML_DOCS = [
    ("spring_boot_intro",       "https://docs.spring.io/spring-boot/docs/current/reference/html/getting-started.html"),
    ("spring_boot_features",    "https://docs.spring.io/spring-boot/docs/current/reference/html/features.html"),
    ("spring_boot_actuator",    "https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html"),
    ("spring_framework_core",   "https://docs.spring.io/spring-framework/docs/current/reference/html/core.html"),
    ("spring_data_jpa",         "https://docs.spring.io/spring-data/jpa/docs/current/reference/html/"),
    ("spring_security_arch",    "https://spring.io/guides/topicals/spring-security-architecture"),
    ("spring_ai_overview",      "https://docs.spring.io/spring-ai/reference/index.html"),
]

def clean_md(text):
    """清理 Markdown/ADoc 保留结构，去除图片/badge"""
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)       # 图片
    text = re.sub(r'\[!\[.*?\]\(.*?\)\]\(.*?\)', '', text)  # badge
    text = re.sub(r'<[^>]+>', '', text)                 # HTML tag
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    return text.strip()

def html_to_text(html, max_chars=15000):
    """用 BeautifulSoup 提取正文文本"""
    soup = BeautifulSoup(html, 'html.parser')
    # 删掉导航、页脚、代码高亮脚本等
    for tag in soup(['nav','footer','script','style','aside','header']):
        tag.decompose()
    # 优先取 main/article/section
    main = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|body|main', re.I))
    text = (main or soup).get_text(separator='\n')
    text = re.sub(r'\n{4,}', '\n\n\n', text).strip()
    if len(text) > max_chars:
        text = text[:max_chars] + '\n\n[内容截取，详见官方文档]'
    return text

def fetch(url, timeout=20):
    try:
        r = sess.get(url, timeout=timeout)
        if r.status_code == 200:
            return r.text
        print(f"    HTTP {r.status_code}")
        return None
    except Exception as e:
        print(f"    ❌ {e}")
        return None

def save(name, content):
    path = os.path.join(KB_DIR, f"{name}.txt")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    kb = len(content.encode()) / 1024
    print(f"    ✅ 保存 {name}.txt ({kb:.1f} KB)")
    return path

# ─── 登录 ────────────────────────────────────────────────────────────────────
def login():
    r = sess.post(f"{BACKEND}/api/user/login",
                  json={"username":"testteacher","password":"123456","role":"teacher"})
    msg = r.json().get("message","")
    print("登录:", msg)
    return r.json().get("success", False)

# ─── 上传一批文件 ─────────────────────────────────────────────────────────────
def upload(file_paths):
    files = [("files", (os.path.basename(f), open(f,'rb'), "text/plain")) for f in file_paths]
    r = sess.post(f"{BACKEND}/api/admin/knowledge/import", files=files)
    for _, (_, fh, _) in files:
        try: fh.close()
        except: pass
    return r.json()

def poll(task_id, total):
    for _ in range(150):
        time.sleep(4)
        d = sess.get(f"{BACKEND}/api/admin/knowledge/task/{task_id}").json().get("data",{})
        done, failed, status = d.get("done",0), d.get("failed",0), d.get("status","")
        pct = int((done+failed)/total*100) if total else 0
        bar = "█"*int(pct/5) + "░"*(20-int(pct/5))
        print(f"  [{bar}] {pct:3d}%  ✅{done} ❌{failed}  {d.get('lastFile','')[:40]}")
        if status != "running":
            return done, failed
    return -1, -1

# ─── 主流程 ───────────────────────────────────────────────────────────────────
def main():
    saved = []

    # 1. GitHub Raw
    print(f"\n🐙 爬取 GitHub 官方文档（{len(GITHUB_DOCS)} 个）...")
    for name, url in GITHUB_DOCS:
        print(f"  → {name}")
        txt = fetch(url)
        if txt and len(txt) > 300:
            txt = clean_md(txt)
            if len(txt) > 15000:
                txt = txt[:15000] + "\n\n[截取，完整见官方仓库]"
            saved.append(save(name, txt))
        else:
            print(f"    ⚠️  内容不足，跳过")
        time.sleep(0.4)

    # 2. Python 官方 HTML 文档
    print(f"\n🐍 爬取 Python 官方文档（{len(PYTHON_DOCS)} 个）...")
    for name, url in PYTHON_DOCS:
        print(f"  → {name}")
        html = fetch(url)
        if html:
            txt = html_to_text(html)
            if len(txt) > 300:
                saved.append(save(name, txt))
            else:
                print("    ⚠️  内容过少，跳过")
        time.sleep(0.5)

    # 3. Spring 官方 HTML 文档
    print(f"\n🍃 爬取 Spring 官方文档（{len(SPRING_HTML_DOCS)} 个）...")
    for name, url in SPRING_HTML_DOCS:
        print(f"  → {name}")
        html = fetch(url)
        if html:
            txt = html_to_text(html, max_chars=18000)
            if len(txt) > 300:
                saved.append(save(name, txt))
            else:
                print("    ⚠️  内容过少，跳过")
        time.sleep(0.8)

    print(f"\n📁 共爬取 {len(saved)} 个官方文档")

    # 4. 登录并批量上传
    if not login():
        print("❌ 登录失败")
        return

    total_done = total_failed = 0
    batches = [saved[i:i+BATCH] for i in range(0, len(saved), BATCH)]

    for bi, batch in enumerate(batches):
        names = [os.path.basename(f) for f in batch]
        print(f"\n📤 第 {bi+1}/{len(batches)} 批 ({len(batch)} 文件)")
        print(f"   {', '.join(names)}")
        try:
            resp = upload(batch)
            if resp.get("success"):
                tid = resp["data"]["taskId"]
                n   = resp["data"]["total"]
                print(f"   任务 {tid}，向量化 {n} 文件...")
                d, f = poll(tid, n)
                total_done += d; total_failed += f
                print(f"   ✅{d} ❌{f}")
            else:
                print(f"   ❌ 上传失败: {resp}")
        except Exception as e:
            print(f"   ❌ 异常: {e}")
        time.sleep(2)

    # 5. 统计
    print(f"\n🎉 全部完成！✅{total_done} ❌{total_failed} / 共{len(saved)}文档")
    try:
        col = "7df670bf-fff7-427d-8806-508d76a77603"
        r = requests.get(f"http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections/{col}/count")
        print(f"📊 Chroma 向量总数: {r.text}")
    except Exception as e:
        print(f"Chroma 查询: {e}")

if __name__ == "__main__":
    main()
