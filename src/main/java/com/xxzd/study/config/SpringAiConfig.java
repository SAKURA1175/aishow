package com.xxzd.study.config;

import com.xxzd.study.ai.SystemPromptProvider;
import com.xxzd.study.config.properties.AiProperties;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringAiConfig {

    @Bean
    public OpenAiChatModel openAiChatModel(AiProperties aiProperties) {
        OpenAiApi openAiApi = OpenAiApi.builder()
                .baseUrl(aiProperties.getApi().getUrl())
                .apiKey(aiProperties.getApi().getKey())
                .build();
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(aiProperties.getModel())
                .build();
        return new OpenAiChatModel(openAiApi, options);
    }

    @Bean
    public ChatClient chatClient(OpenAiChatModel chatModel, SystemPromptProvider systemPromptProvider) {
        String systemPrompt = systemPromptProvider.getSystemPrompt();
        if (systemPrompt == null) {
            systemPrompt = "";
        }
        return ChatClient.builder(chatModel).defaultSystem(systemPrompt).build();
    }
}

