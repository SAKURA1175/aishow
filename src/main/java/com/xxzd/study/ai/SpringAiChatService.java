package com.xxzd.study.ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.model.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import com.xxzd.study.domain.ChatMessage;

@Service
public class SpringAiChatService implements AiChatService {

    private final ChatClient chatClient;

    public SpringAiChatService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    @Override
    public String chat(String userPrompt) {
        if (userPrompt == null) userPrompt = "";
        return chatClient.prompt().user(userPrompt).call().content();
    }

    @Override
    public String chat(String systemPrompt, String userPrompt) {
        if (userPrompt == null) userPrompt = "";
        if (systemPrompt == null) systemPrompt = "";
        return chatClient.prompt().system(systemPrompt).user(userPrompt).call().content();
    }

    @Override
    public String chat(String systemPrompt, List<ChatMessage> history, String userPrompt) {
        if (userPrompt == null) userPrompt = "";
        if (systemPrompt == null) systemPrompt = "";

        List<Message> messages = buildHistory(history);

        return chatClient.prompt()
                .system(systemPrompt)
                .messages(messages)
                .user(userPrompt)
                .call()
                .content();
    }

    @Override
    public String chatWithImage(String systemPrompt, List<ChatMessage> history,
                                String userPrompt, String imageBase64, String mimeType) {
        if (userPrompt == null) userPrompt = "";
        if (systemPrompt == null) systemPrompt = "";

        List<Message> messages = buildHistory(history);

        // 解码 base64 图片，构建 Media 附件
        byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
        MimeType imageMimeType = MimeType.valueOf(
                (mimeType != null && !mimeType.isBlank()) ? mimeType : "image/jpeg");
        Media imageMedia = new Media(imageMimeType, new ByteArrayResource(imageBytes));

        // 构建带图片的 UserMessage
        final String finalPrompt = userPrompt;
        return chatClient.prompt()
                .system(systemPrompt)
                .messages(messages)
                .user(u -> u.text(finalPrompt).media(imageMedia))
                .call()
                .content();
    }

    @Override
    public reactor.core.publisher.Flux<String> streamChat(String systemPrompt, List<ChatMessage> history, String userPrompt) {
        final String finalSysPrompt = systemPrompt == null ? "" : systemPrompt;
        final String finalUserPrompt = userPrompt == null ? "" : userPrompt;

        List<Message> messages = buildHistory(history);

        boolean isDeepThink = finalSysPrompt.contains("<|think|>");

        return reactor.core.publisher.Flux.defer(() -> {
            java.util.concurrent.atomic.AtomicBoolean hasStartedThinking = new java.util.concurrent.atomic.AtomicBoolean(false);

            return chatClient.prompt()
                    .system(finalSysPrompt)
                    .messages(messages)
                    .user(finalUserPrompt)
                    .stream()
                    .chatResponse()
                    .map(response -> {
                        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
                            return "";
                        }
                        String content = response.getResult().getOutput().getText() != null ? response.getResult().getOutput().getText() : "";

                        StringBuilder chunk = new StringBuilder();

                        if (isDeepThink) {
                            if (!hasStartedThinking.get()) {
                                hasStartedThinking.set(true);
                                chunk.append("<think>\n");
                            }
                            
                            // 替换模型原生输出的思考结束 token
                            if (content.contains("<channel|>")) {
                                content = content.replace("<channel|>", "\n</think>\n\n");
                            }
                            // 替换可能出现的 <|channel>thought
                            if (content.contains("<|channel>thought")) {
                                content = content.replace("<|channel>thought", "");
                            }
                            // 替换有时附带的 ThinkingProcess: 前缀
                            if (content.contains("ThinkingProcess:")) {
                                content = content.replace("ThinkingProcess:", "");
                            }
                            if (content.contains("Thinking Process:")) {
                                content = content.replace("Thinking Process:", "");
                            }
                        }

                        chunk.append(content);
                        return chunk.toString();
                    });
        });
    }

    @Override
    public reactor.core.publisher.Flux<String> streamChatWithImage(String systemPrompt, List<ChatMessage> history,
                                                                   String userPrompt, String imageBase64, String mimeType) {
        final String finalSysPrompt = systemPrompt == null ? "" : systemPrompt;
        final String finalUserPrompt = userPrompt == null ? "" : userPrompt;

        List<Message> messages = buildHistory(history);

        byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
        MimeType imageMimeType = MimeType.valueOf(
                (mimeType != null && !mimeType.isBlank()) ? mimeType : "image/jpeg");
        Media imageMedia = new Media(imageMimeType, new ByteArrayResource(imageBytes));

        boolean isDeepThink = finalSysPrompt.contains("<|think|>");

        return reactor.core.publisher.Flux.defer(() -> {
            java.util.concurrent.atomic.AtomicBoolean hasStartedThinking = new java.util.concurrent.atomic.AtomicBoolean(false);

            return chatClient.prompt()
                    .system(finalSysPrompt)
                    .messages(messages)
                    .user(u -> u.text(finalUserPrompt).media(imageMedia))
                    .stream()
                    .chatResponse()
                    .map(response -> {
                        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
                            return "";
                        }
                        String content = response.getResult().getOutput().getText() != null ? response.getResult().getOutput().getText() : "";

                        StringBuilder chunk = new StringBuilder();

                        if (isDeepThink) {
                            if (!hasStartedThinking.get()) {
                                hasStartedThinking.set(true);
                                chunk.append("<think>\n");
                            }
                            
                            // 替换模型原生输出的思考结束 token
                            if (content.contains("<channel|>")) {
                                content = content.replace("<channel|>", "\n</think>\n\n");
                            }
                            // 替换可能出现的 <|channel>thought
                            if (content.contains("<|channel>thought")) {
                                content = content.replace("<|channel>thought", "");
                            }
                            // 替换有时附带的 ThinkingProcess: 前缀
                            if (content.contains("ThinkingProcess:")) {
                                content = content.replace("ThinkingProcess:", "");
                            }
                            if (content.contains("Thinking Process:")) {
                                content = content.replace("Thinking Process:", "");
                            }
                        }

                        chunk.append(content);
                        return chunk.toString();
                    });
        });
    }

    // ── 私有工具 ─────────────────────────────────────────────────────────────

    private List<Message> buildHistory(List<ChatMessage> history) {
        List<Message> messages = new ArrayList<>();
        if (history == null) return messages;
        for (ChatMessage m : history) {
            if (m.getContent() == null) continue;
            if ("user".equalsIgnoreCase(m.getRole())) {
                messages.add(new UserMessage(m.getContent()));
            } else if ("ai".equalsIgnoreCase(m.getRole()) || "assistant".equalsIgnoreCase(m.getRole())) {
                messages.add(new AssistantMessage(m.getContent()));
            }
        }
        return messages;
    }
}


