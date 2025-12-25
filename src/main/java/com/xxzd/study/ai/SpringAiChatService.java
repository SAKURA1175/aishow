package com.xxzd.study.ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.Message;
import java.util.ArrayList;
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
        if (userPrompt == null) {
            userPrompt = "";
        }
        return chatClient.prompt().user(userPrompt).call().content();
    }

    @Override
    public String chat(String systemPrompt, String userPrompt) {
        if (userPrompt == null) {
            userPrompt = "";
        }
        if (systemPrompt == null) {
            systemPrompt = "";
        }
        return chatClient.prompt().system(systemPrompt).user(userPrompt).call().content();
    }

    @Override
    public String chat(String systemPrompt, List<ChatMessage> history, String userPrompt) {
        if (userPrompt == null) userPrompt = "";
        if (systemPrompt == null) systemPrompt = "";

        List<Message> messages = new ArrayList<>();
        if (history != null) {
            for (ChatMessage m : history) {
                if (m.getContent() == null) continue;
                if ("user".equalsIgnoreCase(m.getRole())) {
                    messages.add(new UserMessage(m.getContent()));
                } else if ("ai".equalsIgnoreCase(m.getRole()) || "assistant".equalsIgnoreCase(m.getRole())) {
                    messages.add(new AssistantMessage(m.getContent()));
                }
            }
        }

        return chatClient.prompt()
                .system(systemPrompt)
                .messages(messages)
                .user(userPrompt)
                .call()
                .content();
    }
}

