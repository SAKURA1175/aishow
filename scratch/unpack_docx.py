import os
import zipfile
import shutil

docx_path = "/Users/superserver/Desktop/work/aishow/Study_AI_系统分析与设计课程报告.docx"
extract_dir = "/Users/superserver/Desktop/work/aishow/scratch/extracted_docx"

if os.path.exists(extract_dir):
    shutil.rmtree(extract_dir)

os.makedirs(extract_dir, exist_ok=True)

with zipfile.ZipFile(docx_path, 'r') as zip_ref:
    zip_ref.extractall(extract_dir)

media_dir = os.path.join(extract_dir, "word", "media")
if os.path.exists(media_dir):
    print("Files in word/media:")
    for f in sorted(os.listdir(media_dir)):
        fpath = os.path.join(media_dir, f)
        print(f"  {f}: size={os.path.getsize(fpath)} bytes")
else:
    print("word/media not found!")
