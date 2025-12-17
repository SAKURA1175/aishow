package com.xxzd.study.ai;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class AiHttpClient {

    private final String baseUrl;
    private final String apiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiHttpClient(String baseUrl, String apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    public String chat(String prompt) throws Exception {
        String url = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
        
        // 系统提示词
        String systemPrompt = "你必须完全扮演一个专业的学业辅助AI教师，这是你的唯一身份和职责。" +
                "\n\n【核心身份】" +
                "- 你是学业辅助平台的智能教师助手" +
                "- 你必须始终以'教师'身份回答，而非Qwen助手" +
                "- 你的目标是帮助学生高效学习、掌握知识本质、解决学业困惑" +
                "\n\n【教学原则】" +
                "1. 启发式教学（必须遵守）：优先提出引导性问题，让学生自己推导结论，而非直接给答案" +
                "2. 个性化讲解：根据学生水平调整讲解深度，用学生能理解的语言和例子" +
                "3. 结构化回答：从简到繁，基础→核心→应用，逻辑清晰" +
                "4. 多维反馈：检验理解度、指出易错点、建议后续学习路径" +
                "\n\n【回答模式】" +
                "❌ 禁止：直接给出答案、放弃启发、不符合教师身份" +
                "✅ 必须：提出引导问题→听学生思考→逐步给提示→学生自己得出结论" +
                "\n\n【具体要求】" +
                "- 说话风格：亲切、耐心、鼓励性" +
                "- 语气定位：作为经验丰富的教师在辅导学生" +
                "- 用词习悯：使用'我们来看看'、'你能想想为什么'、'很好的思路'等教师用语" +
                "- 避免自我介绍为Qwen或其他AI助手" +
                "\n\n记住：你现在是教师，不是通用AI助手。每一个回答都要符合教师身份。";
        
        // 使用 ObjectMapper 构建 JSON（正確的转义）
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", "qwen3-max");
        
        ArrayNode messages = objectMapper.createArrayNode();
        ObjectNode systemMsg = objectMapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);
        
        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", prompt);
        messages.add(userMsg);
        
        root.set("messages", messages);
        
        String body = objectMapper.writeValueAsString(root);
        System.out.println("[DEBUG] Request body: " + body.substring(0, Math.min(200, body.length())));

        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/json;charset=UTF-8");
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }

        int code = conn.getResponseCode();
        if (code != 200) {
            try (BufferedReader errorReader = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                StringBuilder errorSb = new StringBuilder();
                String errorLine;
                while ((errorLine = errorReader.readLine()) != null) {
                    errorSb.append(errorLine);
                }
                return "AI 服务错误（" + code + "）：" + errorSb.toString();
            }
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        }
    }
}

