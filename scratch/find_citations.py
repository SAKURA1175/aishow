import docx

template_path = "/Users/superserver/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_7bfrh4ndaf8l22_bdf7/msg/file/2026-05/23级-系统分析与设计-课程报告模板V1.3.docx"
doc = docx.Document(template_path)

for idx, p in enumerate(doc.paragraphs):
    for r_idx, r in enumerate(p.runs):
        if r.font.superscript:
            print(f"P[{idx}] run[{r_idx}]: text='{r.text}' | superscript=True")
