import docx

doc_path = "/Users/superserver/Desktop/work/aishow/TutorMarket_AI_系统分析与设计课程报告.docx"
doc = docx.Document(doc_path)

print("--- Listing ALL Headings in the generated TutorMarket AI document ---")
for idx, p in enumerate(doc.paragraphs):
    if p.style.name.startswith("Heading"):
        print(f"P[{idx}] | Style: {p.style.name} | Text: '{p.text}'")
