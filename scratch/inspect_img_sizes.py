import os
from PIL import Image

media_dir = "/Users/superserver/Desktop/work/aishow/scratch/extracted_docx/word/media"

for f in sorted(os.listdir(media_dir)):
    fpath = os.path.join(media_dir, f)
    try:
        with Image.open(fpath) as img:
            print(f"{f}: format={img.format}, size={img.size} (width={img.width}, height={img.height})")
    except Exception as e:
        print(f"Error reading {f}: {e}")
