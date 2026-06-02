import docx

doc_path = "/private/var/folders/m1/y8wt5fvd3hl_jb3c97rwk3w80000gn/T/MicrosoftEdgeDownloads/638411b0-51e9-4d19-91b8-d7cdff285eae/23级-系统分析与设计-课程报告模板V1.3.docx"
doc = docx.Document(doc_path)

# Print all comments
try:
    comments_part = doc.part.package.get_part('/word/comments.xml')
    import xml.etree.ElementTree as ET
    root = ET.fromstring(comments_part.blob)
    namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    comments = root.findall('.//w:comment', namespaces)
    print(f"Number of comments: {len(comments)}")
    for i, c in enumerate(comments):
        c_id = c.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}id')
        author = c.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}author')
        texts = [t.text for t in c.findall('.//w:t', namespaces) if t.text]
        print(f"Comment {i} (id={c_id}, author={author}): {''.join(texts)}")
except Exception as e:
    print(f"Error reading comments: {e}")
