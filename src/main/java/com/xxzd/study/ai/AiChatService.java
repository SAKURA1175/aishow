package com.xxzd.study.ai;

import java.util.List;
import com.xxzd.study.domain.ChatMessage;

public interface AiChatService {

    String chat(String userPrompt);

    String chat(String systemPrompt, String userPrompt);

    String chat(String systemPrompt, List<ChatMessage> history, String userPrompt);

    /**
     * 多模态对话：支持附带图片（base64 编码）
     *
     * @param systemPrompt 系统提示词
     * @param history      历史消息
     * @param userPrompt   用户文字问题
     * @param imageBase64  图片 base64 数据（不含 data URI 前缀）
     * @param mimeType     图片 MIME 类型，如 image/jpeg, image/png
     */
    String chatWithImage(String systemPrompt, List<ChatMessage> history,
                         String userPrompt, String imageBase64, String mimeType);

    /**
     * 真流式输出：返回响应式 Flux 流
     */
    reactor.core.publisher.Flux<String> streamChat(String systemPrompt, List<ChatMessage> history, String userPrompt);

    /**
     * 真流式输出（带图片）
     */
    reactor.core.publisher.Flux<String> streamChatWithImage(String systemPrompt, List<ChatMessage> history,
                                                            String userPrompt, String imageBase64, String mimeType);

    /**
     * 根据第一轮问答生成简短会话标题（最多 15 字）
     */
    default String generateTitle(String question, String answer) {
        String prompt = "请根据以下对话生成一个简短的会话标题，要求：10字以内，直接输出标题文字，不要加引号或标点。\n用户问：" + question.substring(0, Math.min(question.length(), 80)) + "\nAI答：" + answer.substring(0, Math.min(answer.length(), 100));
        return chat("你是一个助手，只输出标题文字，不超过10字，不带任何标点符号。", prompt);
    }
}
