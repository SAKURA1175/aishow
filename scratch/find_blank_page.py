import docx

doc_path = "/Users/superserver/Desktop/work/aishow/OYY_学院_系统分析与设计课程报告.docx"
doc = docx.Document(doc_path)

print("--- Paragraphs with page breaks or breaks in XML ---")
for i, p in enumerate(doc.paragraphs):
    xml_str = p._element.xml
    if "page" in xml_str or "br" in xml_str or "lastRenderedPageNum" in xml_str:
        # Check if it has pageBreakBefore in paragraph properties
        pPr = p._element.pPr
        has_page_break_before = False
        if pPr is not None:
            pBdr = pPr.find("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pageBreakBefore")
            if pBdr is not None:
                has_page_break_before = True
        
        # Check if it has w:br w:type="page"
        has_br_page = "type=\"page\"" in xml_str
        
        print(f"P[{i}]: text='{p.text[:40]}' | pageBreakBefore={has_page_break_before} | br_page={has_br_page} | len={len(p.text)}")
