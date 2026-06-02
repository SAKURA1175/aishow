import os

fonts_to_check = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf"
]

print("Checking system fonts:")
for f in fonts_to_check:
    print(f"{f}: {'EXISTS' if os.path.exists(f) else 'MISSING'}")
