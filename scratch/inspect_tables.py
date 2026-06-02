import docx

doc_path = "/private/var/folders/m1/y8wt5fvd3hl_jb3c97rwk3w80000gn/T/MicrosoftEdgeDownloads/638411b0-51e9-4d19-91b8-d7cdff285eae/23级-系统分析与设计-课程报告模板V1.3.docx"
doc = docx.Document(doc_path)

for idx, t in enumerate(doc.tables):
    print(f"\n--- TABLE {idx} ---")
    for r_idx, row in enumerate(t.rows):
        cells_text = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
        # remove duplicate consecutive elements in cells_text (python-docx has merged cells showing up multiple times)
        unique_cells = []
        for text in cells_text:
            if not unique_cells or unique_cells[-1] != text:
                unique_cells.append(text)
        print(f"Row {r_idx}: {unique_cells}")
