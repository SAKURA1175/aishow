import docx

doc_path = "/private/var/folders/m1/y8wt5fvd3hl_jb3c97rwk3w80000gn/T/MicrosoftEdgeDownloads/638411b0-51e9-4d19-91b8-d7cdff285eae/23级-系统分析与设计-课程报告模板V1.3.docx"
doc = docx.Document(doc_path)

# Let's find some paragraphs containing [1] or other brackets and inspect their runs
print("--- Runs of paragraphs containing brackets ---")
count = 0
for idx, p in enumerate(doc.paragraphs):
    if "[" in p.text and "]" in p.text and idx < 100:
        print(f"\nP[{idx}] text: {p.text[:80]}...")
        for r_idx, run in enumerate(p.runs):
            if "[" in run.text or "]" in run.text or run.text.isdigit():
                print(f"  Run[{r_idx}]: text='{run.text}' | font={run.font.name} | size={run.font.size} | superscript={run.font.superscript} | subscript={run.font.subscript}")
                count += 1
        if count > 15:
            break
