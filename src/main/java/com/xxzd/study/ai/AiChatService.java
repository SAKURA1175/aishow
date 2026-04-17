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
}
