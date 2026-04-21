package com.xxzd.study.resume;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.xxzd.study.ai.AiChatService;
import com.xxzd.study.domain.Resume;
import com.xxzd.study.mapper.ResumeMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * 简历 AI 分析服务
 * - structuredExtract: 结构化抽取（同步）
 * - streamAnalyze:     SSE 流式分析报告
 * - streamAsk:         SSE 流式追问
 */
@Service
public class ResumeAnalyzeService {

    private static final String STRUCTURE_PROMPT = """
            你是一位专业的简历解析专家。
            请从下面的简历原文中提取结构化信息，严格按照 JSON 格式输出，不要有任何额外说明文字。
            
            输出格式：
            {
              "name": "姓名",
              "targetRole": "目标岗位",
              "education": [{"school":"","major":"","degree":"","period":""}],
              "experience": [{"company":"","role":"","period":"","description":""}],
              "projects": [{"name":"","tech":"","description":""}],
              "skills": [],
              "summary": "自我评价"
            }
            """;

    private static final String ANALYZE_PROMPT = """
            你是一位资深 HR 和职业规划导师，擅长技术岗位简历评估。
            请基于以下简历内容，从以下 5 个维度进行专业分析，最后给出综合评分（0-100）：
            
            1. **内容完整度** — 基本信息、教育、项目、技能是否齐全
            2. **STAR 法则** — 项目/经历描述是否有背景、任务、行动、成果
            3. **量化数据** — 是否有具体数字体现成果（如"提升性能30%"）
            4. **技术关键词** — 技术栈关键词是否丰富且匹配目标岗位
            5. **语言表达** — 是否简洁专业，避免空话套话
            
            输出格式（Markdown）：
            ## 综合评分：XX/100
            
            ### 各维度分析
            | 维度 | 评分 | 建议 |
            |---|:---:|---|
            | 内容完整度 | X/20 | ... |
            ...
            
            ### 重点改进建议
            1. ...
            2. ...
            """;

    @Resource
    private AiChatService aiChatService;

    @Resource
    private ResumeMapper resumeMapper;

    @Resource
    private ResumeKbService resumeKbService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 同步：用 AI 对简历文本做结构化抽取，返回 JSON 字符串
     */
    public String structuredExtract(String rawText) {
        String truncated = rawText.length() > 6000 ? rawText.substring(0, 6000) : rawText;
        String userMsg = "简历原文：\n\n" + truncated;
        try {
            return aiChatService.chat(STRUCTURE_PROMPT, userMsg);
        } catch (Exception e) {
            return "{}";
        }
    }

    /**
     * 流式：AI 分析简历，SSE 推送分析报告
     * 分析前先检索简历知识库补充上下文
     */
    public Flux<String> streamAnalyze(String rawText, String structuredJson) {
        // 检索简历知识库，补充分析上下文
        List<String> kbSnippets = resumeKbService.search("简历评分标准 STAR 量化数据", 3);
        StringBuilder systemPrompt = new StringBuilder(ANALYZE_PROMPT);
        if (!kbSnippets.isEmpty()) {
            systemPrompt.append("\n\n参考资料（简历写作知识库）：\n");
            for (String snippet : kbSnippets) {
                systemPrompt.append("- ").append(snippet, 0, Math.min(snippet.length(), 200)).append("\n");
            }
        }

        String truncated = rawText.length() > 4000 ? rawText.substring(0, 4000) : rawText;
        String userMsg = "请分析以下简历：\n\n" + truncated;

        return aiChatService.streamChat(systemPrompt.toString(), List.of(), userMsg);
    }

    /**
     * 流式：基于简历上下文的追问
     */
    public Flux<String> streamAsk(String rawText, String question) {
        String systemPrompt = """
                你是一位简历优化顾问。用户已上传了他的简历，你正在帮助他改进简历。
                以下是用户的简历内容（部分）：
                
                """ + rawText.substring(0, Math.min(rawText.length(), 3000)) + """
                
                请基于简历内容，专业、简洁地回答用户的问题。
                """;

        return aiChatService.streamChat(systemPrompt, List.of(), question);
    }

    /**
     * 从分析报告文本中解析综合评分
     */
    public int parseScore(String analysisText) {
        if (analysisText == null) return 0;
        // 匹配 "综合评分：XX/100" 或 "评分：XX"
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("综合评分[：:]\\s*(\\d+)").matcher(analysisText);
        if (m.find()) {
            try { return Math.min(100, Integer.parseInt(m.group(1))); } catch (Exception ignored) {}
        }
        return 0;
    }

    /**
     * 保存分析结果到数据库
     */
    public void saveAnalysis(Long resumeId, String structuredJson, String analysisText) {
        int score = parseScore(analysisText);
        // 将分析文本包装成 JSON
        ObjectNode analysisNode = objectMapper.createObjectNode();
        analysisNode.put("report", analysisText);
        analysisNode.put("score", score);
        resumeMapper.updateAnalysis(resumeId, structuredJson, analysisNode.toString(), score);
    }
}
