import docx

doc_path = "/Users/superserver/Desktop/work/aishow/Study_AI_系统分析与设计课程报告.docx"
doc = docx.Document(doc_path)

for idx, p in enumerate(doc.paragraphs):
    if "[" in p.text and "]" in p.text and idx < 200:
        print(f"\nP[{idx}] | Full Text: {p.text[:60]}...")
        for r_idx, run in enumerate(p.runs):
            print(f"  Run[{r_idx}]: text='{run.text}' | superscript={run.font.superscript}")
