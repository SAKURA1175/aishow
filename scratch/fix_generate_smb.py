import re

with open('scratch/generate_smb.py', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# 1. Locate the first occurrence of table_0_data = [
first_idx = content.find("table_0_data = [")
if first_idx == -1:
    print("Error: Could not find first table_0_data = [")
    exit(1)

# We want to replace the corrupted segment. Let's find the start and end of it.
# The start is just after the P[75] replace_simple_p call
p75_marker = 'replace_simple_p(doc.paragraphs[75], "系统管理员与人事/行政用户是平台的后台运维与内容维护者，管理员负责员工账户管理、安全审计和系统配置热更新等功能，能够在线生成随机的 8 位大小写字母/数字账户卡，并查看学员/员工积分消费与激活兑换的物理审计日志。人事与行政则负责上传与上架所属部门的核心专业规章、公文说明，在后台注册会议资源并配置每次允许预订的时长，同时维护首页轮播广告的图示 URL、跳转路由和排序权重。后台管理与运营用例图如图 2-1 所示。")'

p75_idx = content.find(p75_marker)
if p75_idx == -1:
    print("Error: Could not find p75 marker")
    exit(1)

p99_marker = '# P[99]: Usecase label'
p99_idx = content.find(p99_marker)
if p99_idx == -1:
    print("Error: Could not find p99 marker")
    exit(1)

# Replace the text between p75_idx + len(p75_marker) and p99_idx
before_corrupt = content[:p75_idx + len(p75_marker)]
after_corrupt = content[p99_idx:]

restored_section = """

# P[76]: Usecase title
replace_simple_p(doc.paragraphs[76], "系统管理员与教师/运营角色用例图如图 2-1 所示。")

# P[85]: Usecase label
replace_simple_p(doc.paragraphs[85], "图 2-1 后台管理员与行政/人事用例图")

# P[86]: Customer intro
replace_simple_p(doc.paragraphs[86], "企业员工是前台系统的终端消费者，也是获取考勤签到与日常工作流审批服务的核心利益相关者。他们通过手机验证码进行极速登录，随后进入精品课程面板订阅并挑选所学部门（如 Java 高并发编程、MyBatis 源码分析等）。同时，员工可以使用账户关联的虚拟考勤记录，调用平台注册的 AI 插件（如图片生成、视频生成等），并可以通过 JSON 串行编排多个插件组成个性化工作流，一键顺序执行并查看实时积分消费流水。前台学员用户用例图如图 2-2 所示。")

"""

content = before_corrupt + restored_section + after_corrupt
print("Success: Restored corrupted middle section in memory.")

# 2. Let's find the correct table_0_data at the bottom now.
# Since we replaced the first one, there should now be only ONE occurrence of 'table_0_data = [' in the content!
matches = [m.start() for m in re.finditer(r'table_0_data = \[', content)]
print(f"Occurrences of table_0_data after middle restore: {len(matches)}")
if len(matches) != 1:
    print("Error: Expected exactly 1 occurrence of table_0_data now!")
    exit(1)

bottom_idx = matches[0]
# We want to replace table_0_data definition.
# Find where this block ends (usually at the closing bracket of the list).
# The list ends before 't0 = doc.tables[0]'
t0_idx = content.find("t0 = doc.tables[0]", bottom_idx)
if t0_idx == -1:
    print("Error: Could not find t0 = doc.tables[0]")
    exit(1)

before_table0 = content[:bottom_idx]
after_table0 = content[t0_idx:]

new_table0_def = """table_0_data = [
    None,
    ("用例名称", "日常考勤打卡定位"),
    ("主要参与者", "企业员工"),
    ("其他参与者", "MyBatis-Plus ORM 插件、MySQL 关系数据库、Redis 高速缓存"),
    ("描述", "员工在移动端考勤页面点击“签到”或“签退”按钮。移动端捕获手机当前的 GPS 地理坐标与打卡时间戳，调用后端 POST 接口。系统通过 JWT 拦截器校验并获取员工 ID，载入 ThreadLocal 会话环境。考勤引擎从 MySQL/Redis 中加载打卡规则与半径，计算打卡距离。若在允许范围内，则通过悲观行锁锁定考勤主表，自动根据打卡时间段判定打卡状态（正常、迟到、早退或缺勤），并安全写入 MySQL 考勤明细表 `attendance` 中。"),
    ("前置条件", "员工已成功通过手机验证码/微信登录，且当前 JWT Token 处于有效期内"),
    ("后置条件", "系统在 MySQL 中成功持久化考勤明细流水记录，排班日历表同步更新，Redis 考勤限流计数器累加"),
    ("触发条件", "员工在移动端考勤页面点击“日常打卡”或“签退”按钮"),
    ("基本流程", "1. 员工在考勤页面点击“日常打卡”或“签退”按钮。\\n2. 移动端捕获当前手机 of GPS 坐标与打卡时间戳，调用 POST 服务接口。\\n3. 控制器在 ThreadLocal 会话环境下绑定当前员工账户，提交考勤引擎分析。")
]
"""

content = before_table0 + new_table0_def + after_table0
print("Success: Updated table_0_data at the bottom in memory.")

# 3. Let's fix the TOC entries in memory.
# Let's perform standard string replacements for the study-ai headings inside the TOC entries
content = content.replace('"2.3.1 智能AI插件工作流服务编排与计费用例"', '"2.3.1 日常考勤打卡定位用例"')
content = content.replace('"2.3.2 激活码兑换会员与积分用例"', '"2.3.2 日常请假审批申请用例"')
content = content.replace('"4.1 智能AI插件工作流服务编排计费模块"', '"4.1 考勤位置打卡结算模块"')
content = content.replace('"4.1.2 计费与结算核心逻辑流程图"', '"4.1.2 考勤打卡与判定程序流程图"')
content = content.replace('"4.2 会员激活码兑换结算模块"', '"4.2 请假审批工作流模块"')
content = content.replace('"4.2.2 兑换入库程序流程图"', '"4.2.2 审批流流转程序流程图"')
print("Success: Replaced TOC strings in memory.")

# 4. Save the file back!
with open('scratch/generate_smb.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("COMPLETED! Saved generate_smb.py successfully.")
