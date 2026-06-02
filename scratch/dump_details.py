import docx

doc_path = "/private/var/folders/m1/y8wt5fvd3hl_jb3c97rwk3w80000gn/T/MicrosoftEdgeDownloads/638411b0-51e9-4d19-91b8-d7cdff285eae/23级-系统分析与设计-课程报告模板V1.3.docx"
doc = docx.Document(doc_path)

with open("/Users/superserver/Desktop/work/aishow/scratch/full_template_paragraphs.txt", "w", encoding="utf-8") as f:
    for idx, p in enumerate(doc.paragraphs):
        f.write(f"P[{idx}] | Style: {p.style.name} | Text: {p.text}\n")

print("Dumped all paragraphs to scratch/full_template_paragraphs.txt")

# Let's inspect parts in the package to find footnotes or comments or notes
print("\n--- Package parts ---")
for part in doc.part.package.parts:
    part_name = part.partname
    if "footnote" in part_name or "comment" in part_name or "endnote" in part_name:
        print(f"Found part: {part_name}")
        # print some info
        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(part.blob)
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            texts = [t.text for t in root.findall('.//w:t', namespaces) if t.text]
            print(f"  Texts found: {''.join(texts[:200])}...")
        except Exception as e:
            print(f"  Error parsing XML: {e}")
