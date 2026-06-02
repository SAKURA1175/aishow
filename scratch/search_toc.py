import docx

doc_path = "/private/var/folders/m1/y8wt5fvd3hl_jb3c97rwk3w80000gn/T/MicrosoftEdgeDownloads/638411b0-51e9-4d19-91b8-d7cdff285eae/23级-系统分析与设计-课程报告模板V1.3.docx"
doc = docx.Document(doc_path)

print("Searching for paragraphs containing '目录':")
found = False
for idx, p in enumerate(doc.paragraphs):
    if "目录" in p.text or "目" in p.text and "录" in p.text and len(p.text.strip()) < 10:
        print(f"P[{idx}] | Style: {p.style.name} | Text: '{p.text}'")
        found = True

if not found:
    print("No paragraphs containing '目录' found in the template.")
