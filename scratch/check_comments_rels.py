import os
import re

rels_path = "/Users/superserver/Desktop/work/aishow/scratch/extracted_docx/word/_rels/document.xml.rels"

if os.path.exists(rels_path):
    with open(rels_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    print("--- Searching for comment relations in document.xml.rels ---")
    for m in re.finditer(r'<Relationship[^>]*comments[^>]*>', content):
        print(m.group(0))
else:
    print("document.xml.rels not found!")
