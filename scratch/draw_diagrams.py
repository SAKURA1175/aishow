import os
from PIL import Image, ImageDraw, ImageFont

# Define fonts
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
    # Calculate text width/height
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((xy[0] - tw/2, xy[1] - th/2 - 2), text, fill=fill, font=font)

def draw_arrow(draw, start, end, outline="black", fill="black", width=2):
    draw.line([start, end], fill=outline, width=width)
    # Draw arrow head
    # Simple arrow head based on direction
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    import math
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
    # Draw simple stick figure representation for actors
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

# ----------------- IMAGE 3: Admin & Teacher Use Case (779, 566) -----------------
img3 = Image.new("RGB", (779, 566), "white")
draw3 = ImageDraw.Draw(img3)
f_title = get_font(18)
f_normal = get_font(13)

# Title
draw_text_center(draw3, (390, 30), "系统管理员与教师用户用例图", f_title)

# Draw boundary box
draw_rect(draw3, [150, 60, 630, 530], width=2)

# Stick figures
draw_stick_figure(draw3, (75, 280), "系统管理员", f_normal)
draw_stick_figure(draw3, (700, 280), "教师用户", f_normal)

# Use Cases (ovals in boundary)
usecases_admin = [
    ("模型配置与 API 热更新", (390, 100)),
    ("系统提示词在线维护", (390, 180)),
    ("系统问答日志与安全审计", (390, 260))
]
usecases_teacher = [
    ("课件文档上传与解析入库", (390, 340)),
    ("知识库切片管理与向量监控", (390, 420)),
    ("文档删除与切片同步维护", (390, 490))
]

# Draw usecases and connect
for text, pos in usecases_admin:
    draw_oval(draw3, [pos[0]-130, pos[1]-25, pos[0]+130, pos[1]+25])
    draw_text_center(draw3, pos, text, f_normal)
    draw_arrow(draw3, (120, 280), (pos[0]-130, pos[1]))

for text, pos in usecases_teacher:
    draw_oval(draw3, [pos[0]-130, pos[1]-25, pos[0]+130, pos[1]+25])
    draw_text_center(draw3, pos, text, f_normal)
    draw_arrow(draw3, (650, 280), (pos[0]+130, pos[1]))

img3.save(os.path.join(media_out_dir, "image3.png"))
print("Generated image3.png")

# ----------------- IMAGE 4: Student Use Case (794, 757) -----------------
img4 = Image.new("RGB", (794, 757), "white")
draw4 = ImageDraw.Draw(img4)

# Title
draw_text_center(draw4, (397, 40), "学生用户用例图", f_title)

# Boundary box
draw_rect(draw4, [180, 80, 680, 710], width=2)

# Stick figure
draw_stick_figure(draw4, (85, 380), "学生用户", f_normal)

# Use Cases
usecases_student = [
    ("学术智能对话与 RAG 检索", (430, 140)),
    ("联网搜索与实时来源溯源", (430, 250)),
    ("个体学习画像与掌握度分析", (430, 360)),
    ("历史会话管理及上下文切换", (430, 470)),
    ("课件与学科文档浏览下载", (430, 580)),
    ("AI 对话反馈与点赞评分", (430, 660))
]

for text, pos in usecases_student:
    draw_oval(draw4, [pos[0]-150, pos[1]-30, pos[0]+150, pos[1]+30])
    draw_text_center(draw4, pos, text, f_normal)
    draw_arrow(draw4, (135, 380), (pos[0]-150, pos[1]))

img4.save(os.path.join(media_out_dir, "image4.png"))
print("Generated image4.png")

# ----------------- IMAGE 5: Functional Module Tree (1640, 797) -----------------
img5 = Image.new("RGB", (1640, 797), "white")
draw5 = ImageDraw.Draw(img5)
f_mod_title = get_font(24)
f_mod_sub = get_font(18)
f_mod_item = get_font(15)

# Root node
draw_text_center(draw5, (820, 50), "Study AI 智能学业辅助系统功能模块结构图", f_mod_title)
draw_rect(draw5, [620, 100, 1020, 160], width=3)
draw_text_center(draw5, (820, 130), "Study AI 智能学业辅助平台", f_mod_sub)

# First level nodes (5 branches)
modules = [
    ("用户管理模块", (160, 260)),
    ("智能对话模块", (490, 260)),
    ("知识库管理模块", (820, 260)),
    ("学习画像模块", (1150, 260)),
    ("管理设置模块", (1480, 260))
]

# Second level items for each
sub_modules = {
    "用户管理模块": ["登录验证与会话拦截", "学生/教师双重角色分化", "System Prompt 角色分身"],
    "智能对话模块": ["SSE 实时流式响应", "BGE-M3 双路检索RAG", "自托管 SearXNG 联网搜索"],
    "知识库管理模块": ["多格式文档上传解析", "智能文本重叠分块", "向量检索降级关键词匹配"],
    "学习画像模块": ["用户提问主题自动归类", "D3 掌握度层次可视化", "提问历史深度画像日志"],
    "管理设置模块": ["API URL 与密钥热更新", "System Prompt Web端编辑", "缓存监控与配置实时生效"]
}

# Draw lines from root to first level
for title, pos in modules:
    draw_rect(draw5, [pos[0]-120, pos[1]-30, pos[0]+120, pos[1]+30], width=2)
    draw_text_center(draw5, pos, title, f_mod_sub)
    # Line from root bottom to first level top
    draw5.line([820, 160, 820, 200], fill="black", width=2)
    draw5.line([pos[0], 200, pos[0], 230], fill="black", width=2)
    draw5.line([160, 200, 1480, 200], fill="black", width=2)

    # Draw sub modules
    items = sub_modules[title]
    y_start = pos[1] + 60
    for idx, item in enumerate(items):
        item_y = y_start + idx * 80
        draw_rect(draw5, [pos[0]-140, item_y-25, pos[0]+140, item_y+25], width=1)
        draw_text_center(draw5, (pos[0], item_y), item, f_mod_item)
        # Line connect
        draw5.line([pos[0], pos[1]+30, pos[0], item_y-25], fill="black", width=1)

img5.save(os.path.join(media_out_dir, "image5.png"))
print("Generated image5.png")

# ----------------- IMAGE 6: Overall E-R Diagram (1341, 1028) -----------------
img6 = Image.new("RGB", (1341, 1028), "white")
draw6 = ImageDraw.Draw(img6)

# Title
draw_text_center(draw6, (670, 50), "系统总体概念模型 E-R 图", f_title)

# Entities: Rectangles
entities = {
    "用户 (user)": (670, 180),
    "对话会话 (chat_session)": (250, 480),
    "教学文档 (document)": (1090, 480),
    "对话消息 (chat_message)": (250, 780),
    "文档切片 (document_chunk)": (1090, 780),
    "提问日志 (question_log)": (670, 480)
}

for name, pos in entities.items():
    draw_rect(draw6, [pos[0]-130, pos[1]-30, pos[0]+130, pos[1]+30], width=2)
    draw_text_center(draw6, pos, name, f_title)

# Diamonds: Relationships
relationships = [
    ("发起", (460, 330)), # user -> chat_session
    ("生成", (670, 330)), # user -> question_log
    ("上传", (880, 330)), # user -> document
    ("包含", (250, 630)), # session -> message
    ("切片", (1090, 630)) # document -> chunk
]

def draw_diamond(draw, xy, text, font):
    cx, cy = xy
    # Diamond coordinates
    pts = [(cx, cy-25), (cx+70, cy), (cx, cy+25), (cx-70, cy)]
    draw.polygon(pts, fill="white", outline="black", width=2)
    draw_text_center(draw, xy, text, font)

for name, pos in relationships:
    draw_diamond(draw6, pos, name, f_normal)

# Connect lines with cardinality (1, N)
# User to session relationship:
draw6.line([670, 210, 460, 210], fill="black", width=2)
draw6.line([460, 210, 460, 305], fill="black", width=2)
draw_arrow(draw6, (460, 355), (250, 450), width=2)
draw_text_center(draw6, (565, 190), "1", f_normal)
draw_text_center(draw6, (270, 420), "N", f_normal)

# User to log relationship:
draw6.line([670, 210, 670, 305], fill="black", width=2)
draw_arrow(draw6, (670, 355), (670, 450), width=2)
draw_text_center(draw6, (650, 230), "1", f_normal)
draw_text_center(draw6, (650, 420), "N", f_normal)

# User to document relationship:
draw6.line([670, 210, 880, 210], fill="black", width=2)
draw6.line([880, 210, 880, 305], fill="black", width=2)
draw_arrow(draw6, (880, 355), (1090, 450), width=2)
draw_text_center(draw6, (775, 190), "1", f_normal)
draw_text_center(draw6, (1070, 420), "N", f_normal)

# Session to message relationship:
draw6.line([250, 510, 250, 605], fill="black", width=2)
draw_arrow(draw6, (250, 655), (250, 750), width=2)
draw_text_center(draw6, (230, 530), "1", f_normal)
draw_text_center(draw6, (230, 720), "N", f_normal)

# Document to chunk relationship:
draw6.line([1090, 510, 1090, 605], fill="black", width=2)
draw_arrow(draw6, (1090, 655), (1090, 750), width=2)
draw_text_center(draw6, (1070, 530), "1", f_normal)
draw_text_center(draw6, (1070, 720), "N", f_normal)

img6.save(os.path.join(media_out_dir, "image6.png"))
print("Generated image6.png")

# ----------------- IMAGE 7: User Entity Attribute (1107, 701) -----------------
img7 = Image.new("RGB", (1107, 701), "white")
draw7 = ImageDraw.Draw(img7)

draw_text_center(draw7, (553, 50), "用户 (user) 实体属性图", f_title)

# Center Entity
draw_rect(draw7, [433, 310, 673, 390], width=2)
draw_text_center(draw7, (553, 350), "用户 (user)", f_title)

# Attributes
attrs_user = [
    ("id (主键)", (180, 160)),
    ("username (唯一)", (553, 130)),
    ("password", (920, 160)),
    ("role (权限)", (180, 520)),
    ("avatar", (553, 580)),
    ("create_time", (920, 520)),
    ("update_time", (553, 230))
]

for text, pos in attrs_user:
    draw_oval(draw7, [pos[0]-110, pos[1]-25, pos[0]+110, pos[1]+25])
    draw_text_center(draw7, pos, text, f_normal)
    # Line to center
    if pos[1] < 310:
        draw7.line([pos[0], pos[1]+25, 553, 310], fill="black", width=1)
    else:
        draw7.line([pos[0], pos[1]-25, 553, 390], fill="black", width=1)

img7.save(os.path.join(media_out_dir, "image7.png"))
print("Generated image7.png")

# ----------------- IMAGE 8: Document Entity Attribute (835, 424) -----------------
img8 = Image.new("RGB", (835, 424), "white")
draw8 = ImageDraw.Draw(img8)

draw_text_center(draw8, (417, 30), "教学文档 (document) 实体属性图", f_title)

# Center Entity
draw_rect(draw8, [317, 180, 517, 240], width=2)
draw_text_center(draw8, (417, 210), "教学文档 (document)", f_normal)

# Attributes
attrs_doc = [
    ("id (主键)", (100, 70)),
    ("filename", (300, 60)),
    ("file_type", (530, 60)),
    ("uploader_id", (730, 70)),
    ("stored_filename", (100, 340)),
    ("char_count", (300, 350)),
    ("chunk_count", (530, 350)),
    ("status", (730, 340))
]

for text, pos in attrs_doc:
    draw_oval(draw8, [pos[0]-80, pos[1]-20, pos[0]+80, pos[1]+20])
    draw_text_center(draw8, pos, text, f_normal)
    # Line to center
    if pos[1] < 180:
        draw8.line([pos[0], pos[1]+20, 417, 180], fill="black", width=1)
    else:
        draw8.line([pos[0], pos[1]-20, 417, 240], fill="black", width=1)

img8.save(os.path.join(media_out_dir, "image8.png"))
print("Generated image8.png")

# ----------------- IMAGE 9: SSE Sequence Diagram (906, 958) -----------------
img9 = Image.new("RGB", (906, 958), "white")
draw9 = ImageDraw.Draw(img9)

draw_text_center(draw9, (453, 30), "智能问答 SSE 流式交互时序图", f_title)

# Vertical Lifelines
lifelines = {
    "学生浏览器 (React)": 150,
    "对话控制器 (Controller)": 380,
    "SSE流推送引擎 (WebFlux)": 610,
    "大模型服务 (Ollama/API)": 800
}

# Top boxes
for name, x in lifelines.items():
    draw_rect(draw9, [x-80, 80, x+80, 130], width=2)
    draw_text_center(draw9, (x, 105), name, f_normal)
    # dashed lifeline
    for y in range(130, 900, 15):
        draw9.line([x, y, x, y+8], fill="gray", width=1)

# Sequence steps (arrows and labels)
steps = [
    ("1. 发起智能问答 POST /api/chat/ask", 150, 380, 180),
    ("2. 初始化 SseEmitter 异步连接", 380, 610, 240),
    ("3. 建立 SSE HTTP 长连接事件流", 610, 150, 300),
    ("4. 双路降级检索 RAG 拼接上下文 Prompt", 380, 380, 360), # Self-call represented below
    ("5. 发起流式推理请求 (Stream)", 380, 800, 420),
    ("6. 持续流式响应 token 块 (Event: Chunk)", 800, 610, 490),
    ("7. 实时推送 tokens 片段 (SSE stream)", 610, 150, 560),
    ("8. 推送完成标识与关闭 SseEmitter", 610, 150, 720)
]

for label, start_x, end_x, y in steps:
    draw_arrow(draw9, (start_x, y), (end_x, y), width=2)
    label_x = (start_x + end_x) / 2
    draw_text_center(draw9, (label_x, y - 15), label, f_normal)

# Draw self-call box for Step 4
draw_rect(draw9, [380, 345, 420, 395], width=1, fill="lightgray")
draw_text_center(draw9, (470, 360), "提取关键词并语义召回", f_normal)

# Active execution bars (optional visual enhancements)
# Browser active
draw_rect(draw9, [145, 130, 155, 850], width=1, fill="lightgray")
# Controller active
draw_rect(draw9, [375, 180, 385, 450], width=1, fill="lightgray")
# SSE active
draw_rect(draw9, [605, 240, 615, 800], width=1, fill="lightgray")
# LLM active
draw_rect(draw9, [795, 420, 805, 520], width=1, fill="lightgray")

img9.save(os.path.join(media_out_dir, "image9.png"))
print("Generated image9.png")

# ----------------- IMAGE 10: RAG Flowchart (637, 1151) -----------------
img10 = Image.new("RGB", (637, 1151), "white")
draw10 = ImageDraw.Draw(img10)

draw_text_center(draw10, (318, 30), "RAG 检索增强生成与双路降级检索流程图", f_title)

# Nodes: start, process, decision, end
nodes = [
    ("开始 (学生提问)", (318, 90), "oval"),
    ("提取问题学科关键词", (318, 180), "rect"),
    ("是否包含文档/资料提示词?", (318, 280), "diamond"),
    ("调用 BGE-M3 向量化提问", (180, 420), "rect"),
    ("在 ChromaDB 中 Top-K 召回", (180, 520), "rect"),
    ("向量检索是否成功且有效?", (180, 640), "diamond"),
    ("自动降级: MySQL 关键词模糊匹配", (500, 420), "rect"),
    ("匹配词命中率排序并过滤", (500, 520), "rect"),
    ("拼接 [资料X] 注入 Context Prompt", (318, 760), "rect"),
    ("发送至大语言模型并验证引用标记", (318, 860), "rect"),
    ("SSE 引擎逐 token 实时推送", (318, 960), "rect"),
    ("结束", (318, 1060), "oval")
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

# Decision 1 arrows (P[318, 280])
# Yes -> Go left to BGE-M3 (180, 420)
draw10.line([318, 315, 318, 350], fill="black", width=2)
draw10.line([318, 350, 180, 350], fill="black", width=2)
draw_arrow(draw10, (180, 350), (180, 395), width=2)
draw_text_center(draw10, (250, 335), "是 (触发RAG)", f_normal)

# No -> Go right to MySQL keyword (500, 420)
draw10.line([318, 350, 500, 350], fill="black", width=2)
draw_arrow(draw10, (500, 350), (500, 395), width=2)
draw_text_center(draw10, (400, 335), "否 (普通问答)", f_normal)

# Left process
draw_arrow(draw10, (180, 445), (180, 495), width=2)
draw_arrow(draw10, (180, 545), (180, 605), width=2)

# Right process
draw_arrow(draw10, (500, 445), (500, 495), width=2)

# Decision 2 arrows (180, 640)
# Yes -> (318, 760)
draw10.line([180, 675, 180, 715], fill="black", width=2)
draw10.line([180, 715, 318, 715], fill="black", width=2)
draw_arrow(draw10, (318, 715), (318, 735), width=2)
draw_text_center(draw10, (150, 690), "是", f_normal)

# No -> Go to MySQL keyword (500, 420)
draw10.line([180, 640, 60, 640], fill="black", width=2)
draw10.line([60, 640, 60, 420], fill="black", width=2)
draw_arrow(draw10, (60, 420), (390, 420), width=2)
draw_text_center(draw10, (100, 620), "否 (语义检索失败)", f_normal)

# Connect Right side output to Context (318, 760)
draw10.line([500, 545, 500, 715], fill="black", width=2)
draw10.line([500, 715, 318, 715], fill="black", width=2)

# Core final path
draw_arrow(draw10, (318, 785), (318, 835), width=2)
draw_arrow(draw10, (318, 885), (318, 935), width=2)
draw_arrow(draw10, (318, 985), (318, 1040), width=2)

img10.save(os.path.join(media_out_dir, "image10.png"))
print("Generated image10.png")
