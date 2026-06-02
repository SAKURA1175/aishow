with open('scratch/generate_smb.py', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

import re
matches = list(re.finditer(r'table_0_data = \[', content))
print(f"Total occurrences of table_0_data = [: {len(matches)}")
for idx, match in enumerate(matches):
    start = match.start()
    print(f"\n--- Occurrence {idx+1} ---")
    print(content[start:start+1200])
