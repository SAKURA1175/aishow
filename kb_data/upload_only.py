#!/usr/bin/env python3
"""上传所有爬取的知识文档到向量知识库"""
import requests, os, time, glob, json

BACKEND = "http://localhost:8090"
KB_DIR   = "/Users/superserver/Desktop/work/aishow/kb_data"
BATCH    = 8

sess = requests.Session()
sess.trust_env = False  # 不走系统代理，直连 localhost


def login():
    r = sess.post(f"{BACKEND}/api/user/login",
                  json={"username":"testteacher","password":"123456","role":"teacher"})
    d = r.json()
    print("登录:", d.get("message"))
    return d.get("success", False)

def upload(files):
    multi = [("files", (os.path.basename(f), open(f,"rb"), "text/plain")) for f in files]
    r = sess.post(f"{BACKEND}/api/admin/knowledge/import", files=multi)
    for _, (_, fh, _) in multi: fh.close() if hasattr(fh,'close') else None
    # close handles
    for _, (name, fh, ct) in multi:
        try: fh.close()
        except: pass
    return r.json()

def poll(task_id, total):
    for _ in range(120):
        time.sleep(3)
        d = sess.get(f"{BACKEND}/api/admin/knowledge/task/{task_id}").json().get("data",{})
        done   = d.get("done", 0)
        failed = d.get("failed", 0)
        status = d.get("status", "")
        pct    = int((done+failed)/total*100) if total else 0
        bar    = "█"*int(pct/5) + "░"*(20-int(pct/5))
        print(f"  [{bar}] {pct:3d}%  ✅{done} ❌{failed}  {d.get('lastFile','')}")
        if status != "running":
            return done, failed
    return -1, -1

def main():
    all_files = sorted(glob.glob(f"{KB_DIR}/*.txt"))
    all_files = [f for f in all_files if "scrape" not in f and "upload" not in f]
    print(f"📁 找到 {len(all_files)} 个文档\n")

    if not login():
        return

    total_done = total_failed = 0
    batches = [all_files[i:i+BATCH] for i in range(0, len(all_files), BATCH)]

    for bi, batch in enumerate(batches):
        names = [os.path.basename(f) for f in batch]
        print(f"\n📤 第 {bi+1}/{len(batches)} 批 ({len(batch)} 文件)")
        print(f"   {', '.join(names)}")
        try:
            resp = upload(batch)
            if resp.get("success"):
                tid = resp["data"]["taskId"]
                n   = resp["data"]["total"]
                print(f"   任务 {tid}，共 {n} 文件，向量化中...")
                d, f = poll(tid, n)
                total_done += d; total_failed += f
                print(f"   本批完成：✅{d} ❌{f}")
            else:
                print(f"   ❌ 失败: {resp}")
        except Exception as e:
            print(f"   ❌ 异常: {e}")
        time.sleep(1)

    print(f"\n🎉 全部完成！✅{total_done} ❌{total_failed} / 共{len(all_files)}文档")

    # 查 Chroma 总数
    try:
        col_id = "7df670bf-fff7-427d-8806-508d76a77603"
        cnt = requests.get(f"http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections/{col_id}/count").text
        print(f"📊 Chroma 向量总数: {cnt}")
    except Exception as e:
        print(f"Chroma 查询失败: {e}")

if __name__ == "__main__":
    main()
