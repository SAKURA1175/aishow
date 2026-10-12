#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import urllib.request
import urllib.parse
import http.cookiejar
import sys
import io
import time

BASE_URL = "http://127.0.0.1:8090"

class Client:
    def __init__(self, username, password, role):
        self.username = username
        self.password = password
        self.role = role
        self.cj = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cj),
            urllib.request.ProxyHandler({})
        )
        self.user_id = None

    def register(self):
        url = f"{BASE_URL}/api/user/register"
        data = json.dumps({"username": self.username, "password": self.password, "role": self.role}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(req) as resp:
            res_json = json.loads(resp.read().decode())
        if not res_json.get("success"):
            raise Exception(f"Register failed for {self.username}: {res_json}")
        return self

    def login(self):
        url = f"{BASE_URL}/api/user/login"
        data = json.dumps({"username": self.username, "password": self.password, "role": self.role}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        resp = self.opener.open(req)
        res_json = json.loads(resp.read().decode())
        if not res_json.get("success"):
            raise Exception(f"Login failed for {self.username}: {res_json}")
        self.user_id = res_json["data"]["id"]
        return self

    def request(self, method, path, data=None, headers=None, multipart=False):
        url = f"{BASE_URL}{path}"
        req_headers = headers or {}
        req_data = None
        if data is not None:
            if multipart:
                boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
                req_headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
                body = bytearray()
                for k, v in data.items():
                    if isinstance(v, tuple):
                        filename, content, mime = v
                        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{filename}\"\r\nContent-Type: {mime}\r\n\r\n".encode())
                        body.extend(content if isinstance(content, bytes) else content.encode())
                        body.extend(b"\r\n")
                    else:
                        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
                body.extend(f"--{boundary}--\r\n".encode())
                req_data = bytes(body)
            elif isinstance(data, (dict, list)):
                req_headers["Content-Type"] = "application/json"
                req_data = json.dumps(data).encode()
            elif isinstance(data, str):
                req_data = data.encode()
        req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
        try:
            with self.opener.open(req) as resp:
                body = resp.read().decode('utf-8', errors='ignore')
                try:
                    parsed = json.loads(body)
                except:
                    parsed = body
                return resp.status, parsed
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', errors='ignore')
            try:
                parsed = json.loads(body)
            except:
                parsed = body
            return e.code, parsed

def run():
    print("=" * 70)
    print("🚀 开始 17 项权限与业务规则交叉测试")
    print("=" * 70)

    # 1. 初始化账号
    admin = Client("admin", "admin123", "admin").login()
    teacher_a = Client("testteacher", "123456", "teacher").login()
    teacher_b = Client("teacher_liu", "123456", "teacher").login()
    student_a = Client("teststudent", "123456", "student").login()
    student_b = Client("student_li", "123456", "student").login()

    print(f"账号登录就绪:")
    print(f" - Admin: id={admin.user_id}")
    print(f" - Teacher A (testteacher): id={teacher_a.user_id}")
    print(f" - Teacher B (teacher_liu): id={teacher_b.user_id}")
    print(f" - Student A (teststudent): id={student_a.user_id}")
    print(f" - Student B (student_li): id={student_b.user_id}")
    print("-" * 70)

    # 2. 准备两个专属班级和课程
    # 班级 A: Teacher A
    st, res = teacher_a.request("POST", "/api/class/create", {"name": "测试班级A", "semester": "2026-春"})
    class_a_id = res["data"]["id"]
    invite_a = res["data"]["inviteCode"]
    # 学生 A 加入班级 A
    student_a.request("POST", f"/api/class/join?inviteCode={invite_a}")

    # 班级 B: Teacher B
    st, res = teacher_b.request("POST", "/api/class/create", {"name": "测试班级B", "semester": "2026-春"})
    class_b_id = res["data"]["id"]
    invite_b = res["data"]["inviteCode"]
    # 学生 B 加入班级 B
    student_b.request("POST", f"/api/class/join?inviteCode={invite_b}")

    # 创建课程 A (Teacher A) 与 课程 B (Teacher B)
    st, res = teacher_a.request("POST", "/api/grade/course", {"name": "课程A", "code": "CA01", "credit": 3, "semester": "2026-春", "classId": class_a_id})
    course_a_id = res["data"]["id"]

    st, res = teacher_b.request("POST", "/api/grade/course", {"name": "课程B", "code": "CB01", "credit": 3, "semester": "2026-春", "classId": class_b_id})
    course_b_id = res["data"]["id"]

    print(f"环境初始化完成: 班级A={class_a_id}, 课程A={course_a_id} | 班级B={class_b_id}, 课程B={course_b_id}")
    print("-" * 70)

    results = []

    def record(idx, title, passed, detail):
        status = "✅ PASS" if passed else "❌ FAIL"
        results.append((idx, title, passed, detail))
        print(f"[{status}] 问题 {idx}: {title} -> {detail}")

    # ===== P0: 严重越权操作 =====

    # 1. 学生能改、能删任何人的成绩 -> updateGrade, deleteGrade 校验
    st, res = teacher_a.request("POST", "/api/grade/record", {
        "userId": student_a.user_id, "courseId": course_a_id, "score": 85, "semester": "2026-春"
    })
    grade_id = res["data"]["id"]
    # 学生 A 尝试修改成绩
    st1, _ = student_a.request("PUT", f"/api/grade/record/{grade_id}", {"score": 100})
    # 教师 B 尝试修改成绩
    st2, _ = teacher_b.request("PUT", f"/api/grade/record/{grade_id}", {"score": 60})
    # 学生 A 尝试删除成绩
    st3, _ = student_a.request("DELETE", f"/api/grade/record/{grade_id}")
    # 教师 B 尝试删除成绩
    st4, _ = teacher_b.request("DELETE", f"/api/grade/record/{grade_id}")
    # 教师 A 修改 (合法)
    st5, _ = teacher_a.request("PUT", f"/api/grade/record/{grade_id}", {"score": 90})
    p1 = (st1 == 403 and st2 == 403 and st3 == 403 and st4 == 403 and st5 == 200)
    record(1, "学生/非任课教师修改或删除成绩被拦截(403)", p1, f"学生改={st1}, 他师改={st2}, 学生删={st3}, 他师删={st4}, 任课师改={st5}")

    # 2. 学生能看任意作业的全部提交 -> submissions 校验所属教师
    st, res = teacher_a.request("POST", "/api/assignment/create", {
        "classId": class_a_id, "title": "作业A1", "content": "内容", "maxScore": 100
    })
    assign_a_id = res["data"]["id"]
    # 学生 A 提交作业
    student_a.request("POST", f"/api/assignment/{assign_a_id}/submit", {"content": "学生A的作业答案"})
    # 学生 A 尝试看全部提交
    st_s, _ = student_a.request("GET", f"/api/assignment/{assign_a_id}/submissions")
    # 教师 B 尝试看全部提交
    st_tb, _ = teacher_b.request("GET", f"/api/assignment/{assign_a_id}/submissions")
    # 教师 A 看全部提交 (合法)
    st_ta, _ = teacher_a.request("GET", f"/api/assignment/{assign_a_id}/submissions")
    p2 = (st_s == 403 and st_tb == 403 and st_ta == 200)
    record(2, "学生/非所属教师查看作业全部提交被拦截(403)", p2, f"学生={st_s}, 他师={st_tb}, 本师={st_ta}")

    # 3. 学生能看任意考试的全部答卷和统计 -> Exam submissions & stats
    st, res = teacher_a.request("POST", "/api/exam", {
        "classId": class_a_id, "title": "考试A1", "duration": 60, "totalScore": 100
    })
    exam_a_id = res["data"]["id"]
    # 加题
    st, res_q = teacher_a.request("POST", f"/api/exam/{exam_a_id}/question", {
        "type": "choice", "content": "1+1=?", "options": "A. 2\nB. 3", "answer": "A", "score": 100
    })
    q_id = res_q["data"]["id"]
    # 学生 A 提交考试
    student_a.request("POST", f"/api/exam/{exam_a_id}/submit", {"answers": json.dumps({str(q_id): "A"})})
    # 学生 A 尝试查 submissions & stats
    st_es1, _ = student_a.request("GET", f"/api/exam/{exam_a_id}/submissions")
    st_es2, _ = student_a.request("GET", f"/api/exam/{exam_a_id}/stats")
    # 教师 B 尝试查 submissions & stats
    st_et1, _ = teacher_b.request("GET", f"/api/exam/{exam_a_id}/submissions")
    st_et2, _ = teacher_b.request("GET", f"/api/exam/{exam_a_id}/stats")
    # 教师 A 查 (合法)
    st_ok1, _ = teacher_a.request("GET", f"/api/exam/{exam_a_id}/submissions")
    st_ok2, _ = teacher_a.request("GET", f"/api/exam/{exam_a_id}/stats")
    p3 = (st_es1 == 403 and st_es2 == 403 and st_et1 == 403 and st_et2 == 403 and st_ok1 == 200 and st_ok2 == 200)
    record(3, "学生/非出卷教师查看考试全部答卷及统计被拦截(403)", p3, f"学生答卷={st_es1}, 学生统计={st_es2}, 他师答卷={st_et1}, 本师答卷={st_ok1}")

    # 4. 不是这个班的学生，也能交这个班的作业和考试 -> class_member 校验
    # 学生 A 尝试交 班级 B 的作业与考试
    st, res = teacher_b.request("POST", "/api/assignment/create", {
        "classId": class_b_id, "title": "作业B1", "content": "内容", "maxScore": 100
    })
    assign_b_id = res["data"]["id"]
    st, res = teacher_b.request("POST", "/api/exam", {
        "classId": class_b_id, "title": "考试B1", "duration": 60, "totalScore": 100
    })
    exam_b_id = res["data"]["id"]
    # 学生 A (非班级B成员) 提交作业B1
    st_sub_a, res_sub_a = student_a.request("POST", f"/api/assignment/{assign_b_id}/submit", {"content": "非法交作业"})
    # 学生 A (非班级B成员) 提交考试B1
    st_sub_e, res_sub_e = student_a.request("POST", f"/api/exam/{exam_b_id}/submit", {"answers": "{}"})
    p4 = (st_sub_a == 403 and st_sub_e == 403)
    record(4, "非本班学生提交该班作业和考试被拦截(403)", p4, f"作业提交={st_sub_a}, 考试提交={st_sub_e}")

    # ===== P1: 教师与管理员权限隔离 =====

    # 5. 教师不能改全局模型；学情大屏仅管理员或本班教师可看
    st_cfg, _ = teacher_a.request("GET", "/api/admin/model/config")
    st_own, _ = teacher_a.request("GET", f"/api/analytics/screen?classId={class_a_id}")
    st_other, _ = teacher_a.request("GET", f"/api/analytics/screen?classId={class_b_id}")
    st_stu, _ = student_b.request("GET", f"/api/analytics/screen?classId={class_a_id}")
    st_adm_cfg, _ = admin.request("GET", "/api/admin/model/config")
    st_adm_scr, _ = admin.request("GET", f"/api/analytics/screen?classId={class_a_id}")
    p5 = (st_cfg == 403 and st_own == 200 and st_other == 403 and st_stu == 403 and st_adm_cfg == 200 and st_adm_scr == 200)
    record(5, "教师不能改模型配置；仅管理员或本班教师可看学情大屏", p5, f"教师配置={st_cfg}, 本班大屏={st_own}, 他班大屏={st_other}, 学生大屏={st_stu}, 管理员大屏={st_adm_scr}")

    # 6. 别的班的老师能批改、AI批改不属于自己的作业
    # 先获取学生 A 在作业 A1 的 submissionId
    _, sub_list = teacher_a.request("GET", f"/api/assignment/{assign_a_id}/submissions")
    sub_a1_id = sub_list["data"][0]["id"]
    st_grade_b, _ = teacher_b.request("POST", f"/api/assignment/submissions/{sub_a1_id}/grade", {"teacherScore": 95, "feedback": "非法批改"})
    st_aigrade_b, _ = teacher_b.request("POST", f"/api/assignment/submissions/{sub_a1_id}/ai-grade")
    st_grade_a, _ = teacher_a.request("POST", f"/api/assignment/submissions/{sub_a1_id}/grade", {"teacherScore": 95, "feedback": "合规批改"})
    p6 = (st_grade_b == 403 and st_aigrade_b == 403 and st_grade_a == 200)
    record(6, "非本班教师批改/AI批改他人作业被拦截(403)", p6, f"他师批改={st_grade_b}, 他师AI批改={st_aigrade_b}, 本师批改={st_grade_a}")

    # 7. 别的班的老师能发作业、录成绩、改试卷、加题
    # 教师 B 往 班级 A 发作业
    st_fa, _ = teacher_b.request("POST", "/api/assignment/create", {"classId": class_a_id, "title": "越权作业"})
    # 教师 B 给 课程 A 录成绩
    st_lc, _ = teacher_b.request("POST", "/api/grade/record", {"userId": student_a.user_id, "courseId": course_a_id, "score": 90})
    # 教师 B 改 考试 A1
    st_gs, _ = teacher_b.request("PUT", f"/api/exam/{exam_a_id}", {"title": "越权改试卷"})
    # 教师 B 往 考试 A1 加题
    st_jt, _ = teacher_b.request("POST", f"/api/exam/{exam_a_id}/question", {"type": "true_false", "content": "越权题目", "answer": "对", "score": 10})
    p7 = (st_fa == 403 and st_lc == 403 and st_gs == 403 and st_jt == 403)
    record(7, "非所属班级教师发作业/录成绩/改卷/加题被拦截(403)", p7, f"发作业={st_fa}, 录成绩={st_lc}, 改试卷={st_gs}, 加题={st_jt}")

    # 8. 学生能直接读别人的私密笔记
    st, res_note = student_a.request("POST", "/api/notebook", {"title": "学生A私密笔记", "content": "机密", "isShared": False})
    note_a_id = res_note["data"]["id"]
    st_read_b, _ = student_b.request("GET", f"/api/notebook/{note_a_id}")
    st_read_a, _ = student_a.request("GET", f"/api/notebook/{note_a_id}")
    p8 = (st_read_b == 403 and st_read_a == 200)
    record(8, "非本人学生读取他人私密笔记被拦截(403)", p8, f"学生B读={st_read_b}, 本人读={st_read_a}")

    # 9. 知识库文档列表和下载越权
    st, res_doc = teacher_a.request("POST", "/api/document/upload", {
        "file": ("course_a_doc.txt", "课程A讲义内容", "text/plain")
    }, multipart=True)
    doc_a_id = res_doc["data"]["id"]
    # 种子数据里 student_li 已经在 testteacher 的班级中，不能代表“非本班学生”。
    outsider = Client(f"outsider{int(time.time())}", "123456", "student").register().login()
    # 学生 A (班级A) 下载
    st_dl_a, _ = student_a.request("GET", f"/api/document/download/{doc_a_id}")
    # 未加入该教师任何班级的学生下载
    st_dl_b, _ = outsider.request("GET", f"/api/document/download/{doc_a_id}")
    p9 = (st_dl_b == 403 and st_dl_a == 200)
    record(9, "非授权学生下载教师文档被拦截(403)", p9, f"非班级学生下载={st_dl_b}, 本班学生下载={st_dl_a}")

    # 10. 学生能看全班的成绩名册 -> courseGrades 校验
    st_cg_s, _ = student_a.request("GET", f"/api/grade/course/{course_a_id}")
    st_cg_tb, _ = teacher_b.request("GET", f"/api/grade/course/{course_a_id}")
    st_cg_ta, _ = teacher_a.request("GET", f"/api/grade/course/{course_a_id}")
    p10 = (st_cg_s == 403 and st_cg_tb == 403 and st_cg_ta == 200)
    record(10, "学生/非任课教师查看课程成绩名册被拦截(403)", p10, f"学生={st_cg_s}, 他师={st_cg_tb}, 本师={st_cg_ta}")

    # 11. 学生能改别人错题的“已掌握”状态
    st, res_wq = student_a.request("POST", "/api/wrong-question", {
        "subject": "数学", "content": "1+1=?", "mastery": "unmastered"
    })
    wq_id = res_wq["data"]["id"]
    st_wq_b, _ = student_b.request("POST", f"/api/wrong-question/{wq_id}/mastery?mastery=mastered")
    st_wq_a, _ = student_a.request("POST", f"/api/wrong-question/{wq_id}/mastery?mastery=mastered")
    p11 = (st_wq_b == 403 and st_wq_a == 200)
    record(11, "学生修改他人错题掌握状态被拦截(403)", p11, f"他人修改={st_wq_b}, 本人修改={st_wq_a}")

    # ===== P2: 业务规则缺失 =====

    # 12. 考试能无限重交 -> 锁定不可重交
    st_re_exam, _ = student_a.request("POST", f"/api/exam/{exam_a_id}/submit", {"answers": "{}"})
    p12 = (st_re_exam == 403)
    record(12, "考试已提交后禁止重复交卷(403)", p12, f"重复提交状态码={st_re_exam}")

    # 13. 过了截止时间的作业照样能交
    st, res_exp = teacher_a.request("POST", "/api/assignment/create", {
        "classId": class_a_id, "title": "过期作业", "maxScore": 100, "dueDate": "2020-01-01T00:00:00.000+00:00"
    })
    assign_exp_id = res_exp["data"]["id"]
    st_sub_exp, _ = student_a.request("POST", f"/api/assignment/{assign_exp_id}/submit", {"content": "逾期作业"})
    p13 = (st_sub_exp == 403)
    record(13, "作业过期拒绝提交(403)", p13, f"过期提交状态码={st_sub_exp}")

    # 14. 分数没有上下限
    # 作业满分 100，批改给 999
    st_sc1, res_sc1 = teacher_a.request("POST", f"/api/assignment/submissions/{sub_a1_id}/grade", {"teacherScore": 999})
    # 成绩录入给 200
    st_sc2, res_sc2 = teacher_a.request("POST", "/api/grade/record", {"userId": student_a.user_id, "courseId": course_a_id, "score": 200})
    # 成绩录入给 -5
    st_sc3, res_sc3 = teacher_a.request("POST", "/api/grade/record", {"userId": student_a.user_id, "courseId": course_a_id, "score": -5})
    p14 = (res_sc1.get("success") == False and res_sc2.get("success") == False and res_sc3.get("success") == False)
    record(14, "作业分数与课程成绩上下限校验拒绝非法分值", p14, f"作业999分={res_sc1.get('message')}, 成绩200分={res_sc2.get('message')}, 成绩-5分={res_sc3.get('message')}")

    # 15. 管理员删除论坛里别人的帖子
    st, res_post = student_a.request("POST", "/api/post", {"title": "学生A帖子", "content": "求助问题"})
    post_id = res_post["data"]["id"]
    st_del_b, _ = student_b.request("DELETE", f"/api/post/{post_id}")
    st_del_adm, _ = admin.request("DELETE", f"/api/post/{post_id}")
    p15 = (st_del_b == 403 and st_del_adm == 200)
    record(15, "非作者学生无法删帖(403)，管理员有权删帖(200)", p15, f"学生B删帖={st_del_b}, 管理员删帖={st_del_adm}")

    # 16. 不是本班的人看班级详情隐藏邀请码，也不能看成员列表
    st_det, res_det = student_b.request("GET", f"/api/class/{class_a_id}")
    hidden_code = (res_det.get("data", {}).get("inviteCode") is None)
    st_mem, _ = student_b.request("GET", f"/api/class/{class_a_id}/members")
    p16 = (hidden_code and st_mem == 403)
    record(16, "非本班学生隐藏班级邀请码且无权看成员列表(403)", p16, f"邀请码隐藏={hidden_code}, 看成员={st_mem}")

    # 17. 管理员上传知识库文档
    st_up_adm, res_up_adm = admin.request("POST", "/api/document/upload", {
        "file": ("admin_policy.txt", "学校管理规章制度", "text/plain")
    }, multipart=True)
    p17 = (st_up_adm == 200 and res_up_adm.get("success") == True)
    record(17, "管理员上传知识库文档成功(200)", p17, f"状态码={st_up_adm}, 结果={res_up_adm.get('message')}")

    print("=" * 70)
    passed_cnt = sum(1 for _, _, p, _ in results if p)
    print(f"📊 测试总结: 共 17 项，通过: {passed_cnt}/17")
    print("=" * 70)
    if passed_cnt == 17:
        print("🎉 全部 17 项越权与业务规则漏洞交叉验证均通过！")
        return 0
    else:
        print("⚠️ 存在未通过的测试项，请检查！")
        return 1

if __name__ == "__main__":
    sys.exit(run())
