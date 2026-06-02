import docx
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

doc_path = "/Users/superserver/Desktop/work/aishow/Study_AI_系统分析与设计课程报告.docx"
doc = docx.Document(doc_path)

# Let's inspect paragraphs containing images
print("--- Paragraphs containing images ---")
for idx, p in enumerate(doc.paragraphs):
    if "pic:pic" in p._element.xml:
        print(f"P[{idx}] contains image! Text: {p.text.strip()}")
        # Find the image part details
        for run in p.runs:
            if "pic:pic" in run._element.xml:
                print(f"  Run contains picture!")
                
# In python-docx, inline_shapes shows document images
print("\n--- Inline Shapes ---")
for idx, shape in enumerate(doc.inline_shapes):
    print(f"Shape {idx}: type={shape.type}, width={shape.width}, height={shape.height}")
    # find which part it belongs to
    try:
        rId = shape._inline.graphic.graphicData.pic.blipFill.blip.embed
        part = doc.part.related_parts[rId]
        print(f"  Embed rId={rId} | Part={part.partname}")
    except Exception as e:
        print(f"  No direct pic elements or error: {e}")
