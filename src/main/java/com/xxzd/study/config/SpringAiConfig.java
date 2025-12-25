package com.xxzd.study.config;

import com.xxzd.study.ai.SystemPromptProvider;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringAiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder, SystemPromptProvider systemPromptProvider) {
        String systemPrompt = systemPromptProvider.getSystemPrompt();
        if (systemPrompt == null) {
            systemPrompt = "";
        }
        return builder.defaultSystem(systemPrompt).build();
    }
}

