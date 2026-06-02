import os

oyy_generator = "/Users/superserver/Desktop/work/aishow/scratch/generate_oyy.py"

with open(oyy_generator, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Define set_run_fonts helper
set_run_fonts_code = """
def set_run_fonts(run, font_name_zh="宋体", font_name_en="Times New Roman", size_pt=12, is_bold=False):
    run.font.size = Pt(size_pt)
    run.bold = is_bold
    run.font.name = font_name_zh
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn('w:eastAsia'), font_name_zh)
    rFonts.set(qn('w:ascii'), font_name_en)
    rFonts.set(qn('w:hAnsi'), font_name_en)
"""

if "def set_run_fonts" not in content:
    content = content.replace("def replace_simple_p(p, text):", set_run_fonts_code + "\ndef replace_simple_p(p, text):")

# 2. Define TOC update block
toc_update_block = """
# --- 5. UPDATE EXISTING TABLE OF CONTENTS (目录) IN-PLACE ---
p_elms = doc.element.body.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')

# Update Title "目　　录" at XML_P[17]
title_p = docx.text.paragraph.Paragraph(p_elms[17], doc)
title_p.text = "目　　录"
title_p.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER
set_run_fonts(title_p.runs[0], font_name_zh="黑体", font_name_en="Times New Roman", size_pt=16, is_bold=True)

toc_entries = [
    ("第1章　绪论", "1", 12, True),
    ("1.1 研究背景", "1", 12, False),
    ("1.2 国内外研究现状", "1", 12, False),
    ("1.2.1国外研究现状", "1", 12, False),
    ("1.2.2国内研究现状", "2", 12, False),
    ("1.3 研究目的与意义", "3", 12, False),
    ("1.3.1研究目的", "3", 12, False),
    ("1.3.2研究意义", "3", 12, False),
    ("1.4 相关技术介绍", "4", 12, False),
    ("1.4.1 Java 17 语言与多线程高并发", "4", 12, False),
    ("1.4.2 Spring Boot 3.x 核心框架", "4", 12, False),
    ("1.4.3 MySQL 与 Redis 混合存储架构", "4", 12, False),
    ("1.5 系统要解决的主要问题及报告结构", "5", 12, False),
    ("1.5.1系统要解决的主要问题", "5", 12, False),
    ("1.5.2报告结构", "5", 12, False),
    
    ("第2章 系统需求分析", "6", 12, True),
    ("2.1可行性分析", "6", 12, False),
    ("2.1.1 技术可行性分析", "6", 12, False),
    ("2.1.2 经济可行性分析", "6", 12, False),
    ("2.1.3 操作可行性分析", "7", 12, False),
    ("2.2 系统功能需求分析", "7", 12, False),
    ("2.3 系统用例描述", "8", 12, False),
    ("2.3.1 智能AI插件工作流服务编排与计费用例", "8", 12, False),
    ("2.3.2 激活码兑换会员与积分用例", "9", 12, False),
    ("2.4 系统其它需求", "9", 12, False),
    ("2.5 本章小结", "9", 12, False),
    
    ("第3章 系统总体设计", "10", 12, True),
    ("3.1 系统设计原则", "10", 12, False),
    ("3.2 系统功能模块设计", "10", 12, False),
    ("3.3数据库设计", "12", 12, False),
    ("3.3.1概念模型设计", "12", 12, False),
    ("3.3.2数据库表设计", "13", 12, False),
    ("3.4 本章小结", "14", 12, False),
    
    ("第4章 系统详细设计与实现", "15", 12, True),
    ("4.1 智能AI插件工作流服务编排计费模块", "15", 12, False),
    ("4.1.1 模块时序图与交互", "15", 12, False),
    ("4.1.2 计费与结算核心逻辑流程图", "15", 12, False),
    ("4.2 会员激活码兑换结算模块", "16", 12, False),
    ("4.2.1 模块时序图与交互", "16", 12, False),
    ("4.2.2 兑换入库程序流程图", "16", 12, False),
    ("参考文献", "17", 12, True)
]

for idx, (name, page, sz, bold) in enumerate(toc_entries):
    p_elm = p_elms[18 + idx]
    p = docx.text.paragraph.Paragraph(p_elm, doc)
    p.text = f"{name}\\t{page}"
    set_run_fonts(p.runs[0], font_name_zh="黑体" if bold else "宋体", font_name_en="Times New Roman", size_pt=sz, is_bold=bold)
"""

if "UPDATE EXISTING TABLE OF CONTENTS" not in content:
    content = content.replace("doc.save(target_docx)\nprint(\"Text and tables successfully written to docx.\")", toc_update_block + "\ndoc.save(target_docx)\nprint(\"Text and tables successfully written to docx.\")")

with open(oyy_generator, "w", encoding="utf-8") as f:
    f.write(content)

print("Programmatic patch applied successfully to generate_oyy.py!")
