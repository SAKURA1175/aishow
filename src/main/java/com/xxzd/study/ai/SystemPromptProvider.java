package com.xxzd.study.ai;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

@Component
public class SystemPromptProvider {

    private final ResourceLoader resourceLoader;

    private final java.util.Map<String, String> cache = new java.util.concurrent.ConcurrentHashMap<>();

    public SystemPromptProvider(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public String getPromptByRole(String role) {
        // student role -> ai-teacher-prompt.txt (AI Teacher for students)
        // teacher role -> ai-assistant-prompt.txt (AI Assistant for teachers)
        String key = role == null ? "student" : role.toLowerCase();
        return cache.computeIfAbsent(key, k -> {
            if ("teacher".equals(k)) {
                return load("ai-assistant-prompt.txt");
            } else {
                return load("ai-teacher-prompt.txt");
            }
        });
    }

    public String getSystemPrompt() {
        return getPromptByRole("student");
    }

    private String load(String filename) {
        Resource resource = resourceLoader.getResource("classpath:" + filename);
        if (!resource.exists()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) {
                    sb.append("\n");
                    continue;
                }
                if (trimmed.startsWith("#")) {
                    continue;
                }
                sb.append(line).append("\n");
            }
        } catch (Exception e) {
            return "";
        }
        return sb.toString().trim();
    }
}

