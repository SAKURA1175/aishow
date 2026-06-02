import docx

doc_path = "/Users/superserver/Desktop/work/aishow/OYY_学院_系统分析与设计课程报告.docx"
doc = docx.Document(doc_path)

print("--- Paragraphs around P[88] ---")
for idx in range(85, 105):
    p = doc.paragraphs[idx]
    xml_str = p._element.xml
    has_page_break_before = False
    pPr = p._element.pPr
    if pPr is not None:
        pBdr = pPr.find("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pageBreakBefore")
        if pBdr is not None:
            has_page_break_before = True
            
    has_br = "br" in xml_str
    print(f"P[{idx}]: text='{p.text[:40]}' | style={p.style.name} | pageBreakBefore={has_page_break_before} | has_br={has_br} | len={len(p.text)}")
