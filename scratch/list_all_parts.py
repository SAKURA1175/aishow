import docx

doc_path = "/private/var/folders/m1/y8wt5fvd3hl_jb3c97rwk3w80000gn/T/MicrosoftEdgeDownloads/638411b0-51e9-4d19-91b8-d7cdff285eae/23级-系统分析与设计-课程报告模板V1.3.docx"
doc = docx.Document(doc_path)

print("Listing all parts in the package:")
for part in doc.part.package.parts:
    print(part.partname)
