import os
import re
import zipfile
import shutil

extracted_dir = "/Users/superserver/Desktop/work/aishow/scratch/extracted_docx"
target_docx = "/Users/superserver/Desktop/work/aishow/Study_AI_系统分析与设计课程报告.docx"

# 1. Clean document.xml comment tags
doc_xml_path = os.path.join(extracted_dir, "word", "document.xml")
if os.path.exists(doc_xml_path):
    with open(doc_xml_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Strip comment tags
    content = re.sub(r'<w:commentRangeStart[^>]*/>', '', content)
    content = re.sub(r'<w:commentRangeEnd[^>]*/>', '', content)
    content = re.sub(r'<w:commentReference[^>]*/>', '', content)
    
    with open(doc_xml_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Stripped comment tags from document.xml")

# 2. Clean document.xml.rels comment relations
rels_path = os.path.join(extracted_dir, "word", "_rels", "document.xml.rels")
if os.path.exists(rels_path):
    with open(rels_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    content = re.sub(r'<Relationship[^>]*comments[^>]*/>', '', content)
    
    with open(rels_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Stripped comment relationships from document.xml.rels")

# 3. Delete comment files
for f in ["comments.xml", "commentsExtended.xml"]:
    fpath = os.path.join(extracted_dir, "word", f)
    if os.path.exists(fpath):
        os.remove(fpath)
        print(f"Deleted {f}")

# 4. Repack to final docx
if os.path.exists(target_docx):
    os.remove(target_docx)

with zipfile.ZipFile(target_docx, 'w', zipfile.ZIP_DEFLATED) as zip_ref:
    for root, dirs, files in os.walk(extracted_dir):
        for file in files:
            fpath = os.path.join(root, file)
            # calculate relative path
            relpath = os.path.relpath(fpath, extracted_dir)
            zip_ref.write(fpath, relpath)

print(f"Successfully repacked to {target_docx}!")
