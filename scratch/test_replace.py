import docx

doc_path = "/Users/superserver/Desktop/work/aishow/Study_AI_系统分析与设计课程报告.docx"
doc = docx.Document(doc_path)

# Let's inspect paragraph 20 (research background containing [1] and [2])
p = doc.paragraphs[20]
print(f"Original paragraph 20 text: {p.text}")
print("Original runs:")
for idx, r in enumerate(p.runs):
    print(f"  Run[{idx}]: text='{r.text}' | superscript={r.font.superscript}")

# Let's do a test replacement: 
# "在当今的高校教学场景中，教师和学生对于专业知识的获取和检索需求日益迫切[1]。传统的教学系统由于缺乏大模型的语义理解能力，往往只能提供僵硬的关键字匹配，难以满足学生的自主性与深度学习需求[2]。"
# We want to replace paragraph 20 with this, while keeping [1] and [2] in their respective superscript runs!

# Let's implement the replacement algorithm
# For p[20], we have:
# Run[0]: '在当前全球化以及高速信息化的大背景下，各行各业都在积极寻求通过科技手段提升效率和服务质量，以适应日益激烈的市场竞争和不断变化的消费者需求'
# Run[1]: '[1]'
# Run[2]: '。甜品店作为餐饮服务业中极为活跃且竞争激烈的领域，迫切需要利用先进的信息技术来改善管理方式和顾客体验，从而在市场中脱颖而出'
# Run[3]: '[2]'
# Run[4]: '。'

# Let's verify we can replace text
p.runs[0].text = "在当今的高校数字化教学场景中，教师与学生对于学科知识获取的深度与交互质量提出了更高要求"
p.runs[2].text = "。传统的教务学习平台多依赖于简单的层级目录与关键词检索，在应对复杂的多学科交叉问答时极易发生幻觉，无法支撑启发式教学"
p.runs[4].text = "。"

print("\nAfter replacement:")
print(f"New paragraph 20 text: {p.text}")
for idx, r in enumerate(p.runs):
    print(f"  Run[{idx}]: text='{r.text}' | superscript={r.font.superscript}")

