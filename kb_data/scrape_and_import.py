#!/usr/bin/env python3
"""
爬取计算机领域知识文档，保存为 txt，然后批量导入知识库
数据源：Wikipedia（稳定、无需JS、内容高质量）+ GitHub README
"""
import urllib.request
import urllib.parse
import json
import os
import re
import time
import http.cookiejar

OUTPUT_DIR = "/Users/superserver/Desktop/work/aishow/kb_data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

BACKEND = "http://localhost:8090"
COOKIE_JAR = http.cookiejar.CookieJar()
OPENER = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(COOKIE_JAR))
OPENER.addheaders = [('User-Agent', 'Mozilla/5.0 (compatible; StudyAI-KnowledgeBot/1.0)')]
urllib.request.install_opener(OPENER)

# ─── 要爬取的 Wikipedia 文章 ────────────────────────────────────────────────
WIKI_TOPICS = [
    ("java_programming",        "Java_(programming_language)"),
    ("python_programming",      "Python_(programming_language)"),
    ("ai_agent",                "Intelligent_agent"),
    ("langchain",               "LangChain"),
    ("machine_learning",        "Machine_learning"),
    ("deep_learning",           "Deep_learning"),
    ("neural_network",          "Artificial_neural_network"),
    ("large_language_model",    "Large_language_model"),
    ("transformer_model",       "Transformer_(deep_learning_architecture)"),
    ("rag_retrieval",           "Retrieval-augmented_generation"),
    ("data_structures",         "Data_structure"),
    ("algorithms",              "Algorithm"),
    ("sorting_algorithms",      "Sorting_algorithm"),
    ("graph_theory",            "Graph_theory"),
    ("dynamic_programming",     "Dynamic_programming"),
    ("computer_network",        "Computer_network"),
    ("tcp_ip",                  "Internet_protocol_suite"),
    ("http_protocol",           "HTTP"),
    ("rest_api",                "REST"),
    ("database",                "Database"),
    ("sql",                     "SQL"),
    ("nosql",                   "NoSQL"),
    ("redis",                   "Redis"),
    ("docker",                  "Docker_(software)"),
    ("kubernetes",              "Kubernetes"),
    ("microservices",           "Microservices"),
    ("design_patterns",         "Software_design_pattern"),
    ("operating_system",        "Operating_system"),
    ("git_version_control",     "Git"),
    ("linux_os",                "Linux"),
    ("object_oriented",         "Object-oriented_programming"),
    ("functional_programming",  "Functional_programming"),
    ("concurrency",             "Concurrency_(computer_science)"),
    ("vector_database",         "Vector_database"),
    ("prompt_engineering",      "Prompt_engineering"),
]

# ─── GitHub Raw README ────────────────────────────────────────────────────────
GITHUB_READMES = [
    ("langchain_readme",   "https://raw.githubusercontent.com/langchain-ai/langchain/master/README.md"),
    ("openai_cookbook",    "https://raw.githubusercontent.com/openai/openai-cookbook/main/README.md"),
    ("awesome_llm",        "https://raw.githubusercontent.com/Hannibal046/Awesome-LLM/main/README.md"),
    ("awesome_python",     "https://raw.githubusercontent.com/vinta/awesome-python/master/README.md"),
    ("system_design",      "https://raw.githubusercontent.com/donnemartin/system-design-primer/master/README.md"),
]

def fetch_url(url, timeout=15):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.read().decode('utf-8', errors='replace')
    except Exception as e:
        print(f"  ❌ 请求失败: {e}")
        return None

def wiki_to_text(title):
    """调用 Wikipedia API 获取纯文本摘要（action=query&prop=extracts）"""
    params = urllib.parse.urlencode({
        "action": "query",
        "titles": title,
        "prop": "extracts",
        "explaintext": True,
        "exsectionformat": "plain",
        "format": "json",
        "exlimit": 1,
    })
    url = f"https://en.wikipedia.org/w/api.php?{params}"
    html = fetch_url(url)
    if not html:
        return None
    data = json.loads(html)
    pages = data.get("query", {}).get("pages", {})
    for page_id, page in pages.items():
        if page_id == "-1":
            return None
        return page.get("extract", "")
    return None

def clean_text(text):
    # 移除过多空行，保留结构
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    text = re.sub(r'[ \t]+\n', '\n', text)
    return text.strip()

def save_doc(filename, content):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    size_kb = len(content.encode('utf-8')) / 1024
    print(f"  ✅ 保存: {filename} ({size_kb:.1f} KB)")
    return path

# ─── 登录 ─────────────────────────────────────────────────────────────────────
def login():
    print("🔑 登录后台...")
    data = json.dumps({"username": "testteacher", "password": "123456", "role": "teacher"}).encode()
    req = urllib.request.Request(f"{BACKEND}/api/user/login",
                                 data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        resp = json.loads(r.read())
    if resp.get("success"):
        print("  ✅ 登录成功")
        return True
    print(f"  ❌ 登录失败: {resp}")
    return False

# ─── 批量上传 ─────────────────────────────────────────────────────────────────
def upload_files(file_paths):
    print(f"\n📤 上传 {len(file_paths)} 个文件到知识库...")
    boundary = "----KnowledgeBotBoundary"
    body = b""
    for fp in file_paths:
        filename = os.path.basename(fp)
        with open(fp, 'rb') as f:
            content = f.read()
        body += f"--{boundary}\r\n".encode()
        body += f'Content-Disposition: form-data; name="files"; filename="{filename}"\r\n'.encode()
        body += b"Content-Type: text/plain; charset=utf-8\r\n\r\n"
        body += content + b"\r\n"
    body += f"--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        f"{BACKEND}/api/admin/knowledge/import",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req) as r:
        resp = json.loads(r.read())
    if resp.get("success"):
        task_id = resp["data"]["taskId"]
        total = resp["data"]["total"]
        print(f"  ✅ 任务启动: {task_id}，共 {total} 个文件")
        return task_id
    else:
        print(f"  ❌ 上传失败: {resp}")
        return None

def poll_task(task_id):
    print(f"\n⏳ 等待向量化完成（任务 {task_id}）...")
    for i in range(120):  # 最多等 2 分钟
        time.sleep(3)
        url = f"{BACKEND}/api/admin/knowledge/task/{task_id}"
        with urllib.request.urlopen(url) as r:
            resp = json.loads(r.read())
        task = resp.get("data", {})
        done = task.get("done", 0)
        failed = task.get("failed", 0)
        total = task.get("total", 0)
        status = task.get("status", "")
        print(f"  进度: {done+failed}/{total}  ✅{done} ❌{failed}  [{status}]")
        if status != "running":
            print(f"\n🎉 完成！成功 {done} / 失败 {failed} / 共 {total}")
            return
    print("  ⚠️  超时，任务可能仍在运行")

# ─── 主流程 ────────────────────────────────────────────────────────────────────
def main():
    saved_files = []

    # 1. 爬 Wikipedia
    print(f"\n📚 开始爬取 Wikipedia（{len(WIKI_TOPICS)} 个主题）...")
    for name, title in WIKI_TOPICS:
        print(f"  → {title}")
        text = wiki_to_text(title)
        if text and len(text) > 500:
            text = clean_text(text)
            # Wikipedia 文章可能很长，截取前 8000 字保持每份文档适中
            if len(text) > 12000:
                text = text[:12000] + "\n\n[内容截取，完整内容请查阅 Wikipedia]"
            path = save_doc(f"{name}.txt", f"# {title.replace('_', ' ')}\n\n{text}")
            saved_files.append(path)
        else:
            print(f"  ⚠️  {title} 内容不足，跳过")
        time.sleep(0.3)  # 礼貌性限速

    # 2. 爬 GitHub README
    print(f"\n🐙 开始爬取 GitHub README（{len(GITHUB_READMES)} 个）...")
    for name, url in GITHUB_READMES:
        print(f"  → {url}")
        content = fetch_url(url)
        if content and len(content) > 200:
            # 移除过长的 awesome 列表（只保留前 10000 字）
            if len(content) > 10000:
                content = content[:10000] + "\n\n[内容截取]"
            path = save_doc(f"{name}.txt", content)
            saved_files.append(path)
        else:
            print(f"  ⚠️  获取失败，跳过")
        time.sleep(0.5)

    print(f"\n📁 共生成 {len(saved_files)} 个知识文档")

    # 3. 登录并上传
    if not login():
        print("登录失败，退出")
        return

    # 分批上传（每批 10 个防止超时）
    batch_size = 10
    for i in range(0, len(saved_files), batch_size):
        batch = saved_files[i:i+batch_size]
        print(f"\n📤 第 {i//batch_size + 1} 批：{[os.path.basename(f) for f in batch]}")
        task_id = upload_files(batch)
        if task_id:
            poll_task(task_id)

    print("\n✅ 全部完成！知识库已就绪。")

if __name__ == "__main__":
    main()
