import os
import math
from PIL import Image, ImageDraw, ImageFont

# Define macOS standard fonts
font_zh_path = "/System/Library/Fonts/STHeiti Light.ttc"
font_en_path = "/System/Library/Fonts/Supplemental/Arial.ttf"

def get_font(size, is_zh=True):
    path = font_zh_path if is_zh else font_en_path
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_oval(draw, xy, outline="black", fill="white", width=2):
    draw.ellipse(xy, fill=fill, outline=outline, width=width)

def draw_rect(draw, xy, outline="black", fill="white", width=2):
    draw.rectangle(xy, fill=fill, outline=outline, width=width)

def draw_text_center(draw, xy, text, font, fill="black"):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((xy[0] - tw/2, xy[1] - th/2 - 2), text, fill=fill, font=font)

def draw_arrow(draw, start, end, outline="black", fill="black", width=2):
    draw.line([start, end], fill=outline, width=width)
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    angle = math.atan2(dy, dx)
    arrow_len = 10
    angle1 = angle + math.pi * 5 / 6
    angle2 = angle - math.pi * 5 / 6
    x1 = end[0] + arrow_len * math.cos(angle1)
    y1 = end[1] + arrow_len * math.sin(angle1)
    x2 = end[0] + arrow_len * math.cos(angle2)
    y2 = end[1] + arrow_len * math.sin(angle2)
    draw.polygon([end, (x1, y1), (x2, y2)], fill=fill, outline=outline)

def draw_stick_figure(draw, xy, label, font):
    cx, cy = xy
    # head
    draw.ellipse([cx-15, cy-40, cx+15, cy-10], fill="white", outline="black", width=2)
    # body
    draw.line([cx, cy-10, cx, cy+20], fill="black", width=2)
    # arms
    draw.line([cx-25, cy, cx+25, cy], fill="black", width=2)
    # legs
    draw.line([cx, cy+20, cx-15, cy+45], fill="black", width=2)
    draw.line([cx, cy+20, cx+15, cy+45], fill="black", width=2)
    # Label
    draw_text_center(draw, (cx, cy+65), label, font)

media_out_dir = "/Users/superserver/Desktop/work/aishow/scratch/extracted_docx/word/media"
os.makedirs(media_out_dir, exist_ok=True)

f_title = get_font(18)
f_normal = get_font(13)

# ----------------- IMAGE 3: Admin & Teacher Use Case (779, 566) -----------------
img3 = Image.new("RGB", (779, 566), "white")
draw3 = ImageDraw.Draw(img3)

draw_text_center(draw3, (390, 30), "后台管理员与讲师/运营用户用例图", f_title)
draw_rect(draw3, [150, 60, 630, 530], width=2)

draw_stick_figure(draw3, (75, 280), "系统管理员", f_normal)
draw_stick_figure(draw3, (700, 280), "讲师与运营用户", f_normal)

usecases_admin = [
    ("模型参数与 API 热更新", (390, 100)),
    ("激活码批量生成与注销", (390, 180)),
    ("系统问答日志与安全审计", (390, 260))
]
usecases_teacher = [
    ("课程内容上传与信息上架", (390, 340)),
    ("AI 插件注册与计费配置", (390, 420)),
    ("首页轮播广告在线维护", (390, 490))
]

for text, pos in usecases_admin:
    draw_oval(draw3, [pos[0]-130, pos[1]-25, pos[0]+130, pos[1]+25])
    draw_text_center(draw3, pos, text, f_normal)
    draw_arrow(draw3, (120, 280), (pos[0]-130, pos[1]))

for text, pos in usecases_teacher:
    draw_oval(draw3, [pos[0]-130, pos[1]-25, pos[0]+130, pos[1]+25])
    draw_text_center(draw3, pos, text, f_normal)
    draw_arrow(draw3, (650, 280), (pos[0]+130, pos[1]))

img3.save(os.path.join(media_out_dir, "image3.png"))
print("Generated OYY image3.png")

# ----------------- IMAGE 4: Student Use Case (794, 757) -----------------
img4 = Image.new("RGB", (794, 757), "white")
draw4 = ImageDraw.Draw(img4)

draw_text_center(draw4, (397, 40), "前台学员用户核心业务用例图", f_title)
draw_rect(draw4, [180, 80, 680, 710], width=2)

draw_stick_figure(draw4, (85, 380), "学院学员", f_normal)

usecases_student = [
    ("手机短信与微信扫码登录", (430, 140)),
    ("精品课程浏览与章节订阅", (430, 250)),
    ("激活码兑换会员与积分", (430, 360)),
    ("AI 插件调用与图像生成", (430, 470)),
    ("智能工作流 JSON 多步编排", (430, 580)),
    ("消费流水记录与分销推广", (430, 660))
]

for text, pos in usecases_student:
    draw_oval(draw4, [pos[0]-150, pos[1]-30, pos[0]+150, pos[1]+30])
    draw_text_center(draw4, pos, text, f_normal)
    draw_arrow(draw4, (135, 380), (pos[0]-150, pos[1]))

img4.save(os.path.join(media_out_dir, "image4.png"))
print("Generated OYY image4.png")

# ----------------- IMAGE 5: Functional Module Tree (1640, 797) -----------------
img5 = Image.new("RGB", (1640, 797), "white")
draw5 = ImageDraw.Draw(img5)
f_mod_title = get_font(24)
f_mod_sub = get_font(18)
f_mod_item = get_font(15)

draw_text_center(draw5, (820, 50), "OYY学院后端管理平台功能模块结构图", f_mod_title)
draw_rect(draw5, [620, 100, 1020, 160], width=3)
draw_text_center(draw5, (820, 130), "OYY学院后端管理平台", f_mod_sub)

modules = [
    ("用户与认证模块", (160, 260)),
    ("课程与内容模块", (490, 260)),
    ("AI 插件与工作流", (820, 260)),
    ("积分与会员结算", (1150, 260)),
    ("运营与后台设置", (1480, 260))
]

sub_modules = {
    "用户与认证模块": ["手机验证码注册登录", "微信扫码授权登录", "ThreadLocal 会话拦截"],
    "课程与内容模块": ["精品课程多维检索", "章节详情与讲师介绍", "大文件并发上传至OSS"],
    "AI 插件与工作流": ["多类型 AI 插件卡片", "插件 API 计费配置", "自定义工作流多步编排"],
    "积分与会员结算": ["激活码兑换会员积分", "推广分销佣金流水", "积分扣减及消费审计"],
    "运营与后台设置": ["批量随机激活码生成", "轮播图展示权重管理", "预设 Prompt 模板维护"]
}

for title, pos in modules:
    draw_rect(draw5, [pos[0]-120, pos[1]-30, pos[0]+120, pos[1]+30], width=2)
    draw_text_center(draw5, pos, title, f_mod_sub)
    draw5.line([820, 160, 820, 200], fill="black", width=2)
    draw5.line([pos[0], 200, pos[0], 230], fill="black", width=2)
    draw5.line([160, 200, 1480, 200], fill="black", width=2)

    items = sub_modules[title]
    y_start = pos[1] + 60
    for idx, item in enumerate(items):
        item_y = y_start + idx * 80
        draw_rect(draw5, [pos[0]-140, item_y-25, pos[0]+140, item_y+25], width=1)
        draw_text_center(draw5, (pos[0], item_y), item, f_mod_item)
        draw5.line([pos[0], pos[1]+30, pos[0], item_y-25], fill="black", width=1)

img5.save(os.path.join(media_out_dir, "image5.png"))
print("Generated OYY image5.png")

# ----------------- IMAGE 6: Overall E-R Diagram (1341, 1028) -----------------
img6 = Image.new("RGB", (1341, 1028), "white")
draw6 = ImageDraw.Draw(img6)

draw_text_center(draw6, (670, 50), "系统总体概念模型 E-R 图", f_title)

entities = {
    "用户 (users)": (670, 180),
    "课程 (courses)": (250, 480),
    "激活码 (activation_codes)": (1090, 480),
    "AI 插件 (plugins)": (250, 780),
    "消费记录 (consumption_info)": (1090, 780),
    "工作流 (workflows)": (670, 480)
}

for name, pos in entities.items():
    draw_rect(draw6, [pos[0]-130, pos[1]-30, pos[0]+130, pos[1]+30], width=2)
    draw_text_center(draw6, pos, name, f_title)

relationships = [
    ("购买", (460, 330)), 
    ("编排", (670, 330)), 
    ("兑换", (880, 330)), 
    ("使用", (250, 630)), 
    ("记录", (1090, 630))
]

def draw_diamond(draw, xy, text, font):
    cx, cy = xy
    pts = [(cx, cy-25), (cx+70, cy), (cx, cy+25), (cx-70, cy)]
    draw.polygon(pts, fill="white", outline="black", width=2)
    draw_text_center(draw, xy, text, font)

for name, pos in relationships:
    draw_diamond(draw6, pos, name, f_normal)

# Connect user -> purchase -> course
draw6.line([670, 210, 460, 210], fill="black", width=2)
draw6.line([460, 210, 460, 305], fill="black", width=2)
draw_arrow(draw6, (460, 355), (250, 450), width=2)
draw_text_center(draw6, (565, 190), "1", f_normal)
draw_text_center(draw6, (270, 420), "N", f_normal)

# Connect user -> workflow
draw6.line([670, 210, 670, 305], fill="black", width=2)
draw_arrow(draw6, (670, 355), (670, 450), width=2)
draw_text_center(draw6, (650, 230), "1", f_normal)
draw_text_center(draw6, (650, 420), "N", f_normal)

# Connect user -> activation_code
draw6.line([670, 210, 880, 210], fill="black", width=2)
draw6.line([880, 210, 880, 305], fill="black", width=2)
draw_arrow(draw6, (880, 355), (1090, 450), width=2)
draw_text_center(draw6, (775, 190), "1", f_normal)
draw_text_center(draw6, (1070, 420), "N", f_normal)

# Connect course -> plugin (use)
draw6.line([250, 510, 250, 605], fill="black", width=2)
draw_arrow(draw6, (250, 655), (250, 750), width=2)
draw_text_center(draw6, (230, 530), "1", f_normal)
draw_text_center(draw6, (230, 720), "N", f_normal)

# Connect user -> consumption_record (record)
draw6.line([1090, 510, 1090, 605], fill="black", width=2)
draw_arrow(draw6, (1090, 655), (1090, 750), width=2)
draw_text_center(draw6, (1070, 530), "1", f_normal)
draw_text_center(draw6, (1070, 720), "N", f_normal)

img6.save(os.path.join(media_out_dir, "image6.png"))
print("Generated OYY image6.png")

# ----------------- IMAGE 7: User Entity Attribute (1107, 701) -----------------
img7 = Image.new("RGB", (1107, 701), "white")
draw7 = ImageDraw.Draw(img7)

draw_text_center(draw7, (553, 50), "用户 (users) 实体属性图", f_title)
draw_rect(draw7, [433, 310, 673, 390], width=2)
draw_text_center(draw7, (553, 350), "用户 (users)", f_title)

attrs_user = [
    ("id (主键)", (180, 160)),
    ("username (唯一)", (553, 130)),
    ("phone (唯一)", (920, 160)),
    ("gender", (180, 520)),
    ("avatar", (553, 580)),
    ("user_type", (920, 520)),
    ("member_info_id", (553, 230))
]

for text, pos in attrs_user:
    draw_oval(draw7, [pos[0]-110, pos[1]-25, pos[0]+110, pos[1]+25])
    draw_text_center(draw7, pos, text, f_normal)
    if pos[1] < 310:
        draw7.line([pos[0], pos[1]+25, 553, 310], fill="black", width=1)
    else:
        draw7.line([pos[0], pos[1]-25, 553, 390], fill="black", width=1)

img7.save(os.path.join(media_out_dir, "image7.png"))
print("Generated OYY image7.png")

# ----------------- IMAGE 8: ActivationCode Entity Attribute (835, 424) -----------------
img8 = Image.new("RGB", (835, 424), "white")
draw8 = ImageDraw.Draw(img8)

draw_text_center(draw8, (417, 30), "激活码 (activation_codes) 实体属性图", f_title)
draw_rect(draw8, [280, 180, 554, 240], width=2)
draw_text_center(draw8, (417, 210), "激活码 (activation_codes)", f_normal)

attrs_doc = [
    ("id (主键)", (100, 70)),
    ("code (唯一)", (300, 60)),
    ("member_level", (530, 60)),
    ("duration_days", (730, 70)),
    ("status", (100, 340)),
    ("user_id", (300, 350)),
    ("use_time", (530, 350)),
    ("expire_time", (730, 340))
]

for text, pos in attrs_doc:
    draw_oval(draw8, [pos[0]-80, pos[1]-20, pos[0]+80, pos[1]+20])
    draw_text_center(draw8, pos, text, f_normal)
    if pos[1] < 180:
        draw8.line([pos[0], pos[1]+20, 417, 180], fill="black", width=1)
    else:
        draw8.line([pos[0], pos[1]-20, 417, 240], fill="black", width=1)

img8.save(os.path.join(media_out_dir, "image8.png"))
print("Generated OYY image8.png")

# ----------------- IMAGE 9: SSE Sequence Diagram (906, 958) -----------------
img9 = Image.new("RGB", (906, 958), "white")
draw9 = ImageDraw.Draw(img9)

draw_text_center(draw9, (453, 30), "工作流执行与积分扣减结算时序图", f_title)

lifelines = {
    "学员浏览器 (React)": 150,
    "工作流控制器 (Controller)": 380,
    "结算与执行引擎 (Service)": 610,
    "数据库与缓存 (MySQL/Redis)": 800
}

for name, x in lifelines.items():
    draw_rect(draw9, [x-80, 80, x+80, 130], width=2)
    draw_text_center(draw9, (x, 105), name, f_normal)
    for y in range(130, 900, 15):
        draw9.line([x, y, x, y+8], fill="gray", width=1)

steps = [
    ("1. 执行工作流 POST /api/workflow/run", 150, 380, 180),
    ("2. 鉴权与 ThreadLocal 会话上下文注入", 380, 380, 240), 
    ("3. 校验用户积分余额与插件计费单价", 380, 610, 320),
    ("4. 查询物理数据库并扣减 Redis 积分缓存", 610, 800, 380),
    ("5. 扣减积分成功并写入消费记录流水", 610, 800, 480),
    ("6. 调用后台 AI 插件服务并发编排执行", 380, 800, 580),
    ("7. 插件服务顺序响应执行结果元数据", 800, 610, 680),
    ("8. 返回成功执行结果 Result.success()", 380, 150, 780)
]

# Browser active
draw_rect(draw9, [145, 130, 155, 850], width=1, fill="lightgray")
# Controller active
draw_rect(draw9, [375, 180, 385, 800], width=1, fill="lightgray")
# Service active
draw_rect(draw9, [605, 320, 615, 720], width=1, fill="lightgray")
# DB active
draw_rect(draw9, [795, 380, 805, 700], width=1, fill="lightgray")

for label, start_x, end_x, y in steps:
    draw_arrow(draw9, (start_x, y), (end_x, y), width=2)
    label_x = (start_x + end_x) / 2
    draw_text_center(draw9, (label_x, y - 15), label, f_normal)

# Self-call for Step 2
draw_rect(draw9, [380, 225, 420, 275], width=1, fill="lightgray")
draw_text_center(draw9, (470, 240), "ThreadLocal 提取用户", f_normal)

img9.save(os.path.join(media_out_dir, "image9.png"))
print("Generated OYY image9.png")

# ----------------- IMAGE 10: RAG Flowchart (637, 1151) -----------------
img10 = Image.new("RGB", (637, 1151), "white")
draw10 = ImageDraw.Draw(img10)

draw_text_center(draw10, (318, 30), "会员激活码兑换与结算系统流程图", f_title)

nodes = [
    ("开始 (学员输入激活码)", (318, 90), "oval"),
    ("POST /api/member/activate", (318, 180), "rect"),
    ("激活码是否存在于数据库?", (318, 280), "diamond"),
    ("激活码是否已使用或过期?", (318, 420), "diamond"),
    ("锁定行记录 (SELECT FOR UPDATE)", (180, 560), "rect"),
    ("状态设为 1 (已使用) 并绑定当前用户ID", (180, 660), "rect"),
    ("兑换类型是会员还是积分?", (180, 780), "diamond"),
    ("延长用户会员有效天数", (80, 900), "rect"),
    ("增加用户积分账户余额 (balance)", (280, 900), "rect"),
    ("写入消费记录 (consumption_info)", (180, 1000), "rect"),
    ("返回成功 Result.success() 数据包", (318, 1090), "rect"),
    ("返回业务异常 (code: 0, msg说明)", (480, 420), "rect"),
    ("结束", (318, 1130), "oval")
]

def draw_diamond_flow(draw, xy, text, font):
    cx, cy = xy
    pts = [(cx, cy-35), (cx+110, cy), (cx, cy+35), (cx-110, cy)]
    draw.polygon(pts, fill="white", outline="black", width=2)
    draw_text_center(draw, xy, text, font)

for name, pos, shape_type in nodes:
    if shape_type == "oval":
        draw_oval(draw10, [pos[0]-80, pos[1]-20, pos[0]+80, pos[1]+20], width=2)
        draw_text_center(draw10, pos, name, f_normal)
    elif shape_type == "rect":
        draw_rect(draw10, [pos[0]-110, pos[1]-25, pos[0]+110, pos[1]+25], width=2)
        draw_text_center(draw10, pos, name, f_normal)
    elif shape_type == "diamond":
        draw_diamond_flow(draw10, pos, name, f_normal)

# Flow Arrows
draw_arrow(draw10, (318, 110), (318, 155), width=2)
draw_arrow(draw10, (318, 205), (318, 245), width=2)

# Decision 1 arrows (是否存在?)
# Yes -> (318, 420)
draw_arrow(draw10, (318, 315), (318, 385), width=2)
draw_text_center(draw10, (335, 340), "是", f_normal)

# No -> (480, 420)
draw10.line([318, 280, 480, 280], fill="black", width=2)
draw_arrow(draw10, (480, 280), (480, 395), width=2)
draw_text_center(draw10, (400, 260), "否 (非法码)", f_normal)

# Decision 2 arrows (是否已使用/过期?)
# No -> (180, 560)
draw10.line([318, 455, 318, 490], fill="black", width=2)
draw10.line([318, 490, 180, 490], fill="black", width=2)
draw_arrow(draw10, (180, 490), (180, 535), width=2)
draw_text_center(draw10, (260, 470), "否 (有效)", f_normal)

# Yes -> (480, 420)
draw_arrow(draw10, (318, 420), (370, 420), width=2)
draw_text_center(draw10, (340, 400), "是", f_normal)

# Middle paths
draw_arrow(draw10, (180, 585), (180, 635), width=2)
draw_arrow(draw10, (180, 685), (180, 745), width=2)

# Decision 3 arrows (会员还是积分?)
# Member -> (80, 900)
draw10.line([180, 815, 180, 845], fill="black", width=2)
draw10.line([180, 845, 80, 845], fill="black", width=2)
draw_arrow(draw10, (80, 845), (80, 875), width=2)
draw_text_center(draw10, (120, 825), "会员级", f_normal)

# Points -> (280, 900)
draw10.line([180, 845, 280, 845], fill="black", width=2)
draw_arrow(draw10, (280, 845), (280, 875), width=2)
draw_text_center(draw10, (240, 825), "积分面值", f_normal)

# Merge back from Member/Points to (180, 1000)
draw10.line([80, 925, 80, 960], fill="black", width=2)
draw10.line([80, 960, 180, 960], fill="black", width=2)
draw10.line([280, 925, 280, 960], fill="black", width=2)
draw10.line([280, 960, 180, 960], fill="black", width=2)
draw_arrow(draw10, (180, 960), (180, 975), width=2)

# Exit from success to (318, 1090)
draw10.line([180, 1025, 180, 1090], fill="black", width=2)
draw_arrow(draw10, (180, 1090), (208, 1090), width=2)

# Exit from fail to (318, 1090)
draw10.line([480, 445, 480, 1060], fill="black", width=2)
draw10.line([480, 1060, 318, 1060], fill="black", width=2)
draw_arrow(draw10, (318, 1060), (318, 1065), width=2)

# Final exit
draw_arrow(draw10, (318, 1115), (318, 1110), width=2)

img10.save(os.path.join(media_out_dir, "image10.png"))
print("Generated OYY image10.png")
