package com.xxzd.study.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.xxzd.study.config.properties.AiProperties;
import com.xxzd.study.domain.ChatMessage;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

@Service
public class SpringAiChatService implements AiChatService {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;
    private final URL chatCompletionsUrl;
    private final int connectTimeoutMs;
    private final int readTimeoutMs;
    private final int streamReadTimeoutMs;

    public SpringAiChatService(AiProperties aiProperties) {
        this.aiProperties = aiProperties;
        this.objectMapper = new ObjectMapper();

        AiProperties.Api api = aiProperties.getApi();
        this.connectTimeoutMs = Math.max(500, api != null ? api.getConnectTimeoutMs() : 2000);
        this.readTimeoutMs = Math.max(5000, api != null ? api.getReadTimeoutMs() : 90000);
        this.streamReadTimeoutMs = Math.max(300000, this.readTimeoutMs);
        try {
            this.chatCompletionsUrl = new URL(normalizeApiBaseUrl(api != null ? api.getUrl() : null) + "/chat/completions");
        } catch (Exception e) {
            throw new RuntimeException("AI API 地址无效: " + e.getMessage(), e);
        }
    }

    @Override
    public String chat(String userPrompt) {
        return chat("", List.of(), userPrompt);
    }

    @Override
    public String chat(String systemPrompt, String userPrompt) {
        return chat(systemPrompt, List.of(), userPrompt);
    }

    @Override
    public String chat(String systemPrompt, List<ChatMessage> history, String userPrompt) {
        try {
            ObjectNode payload = buildPayload(systemPrompt, history, userPrompt, null, null, false);
            String body = executeJsonRequest(payload, readTimeoutMs);
            JsonNode root = objectMapper.readTree(body);
            return extractContent(root.path("choices").path(0).path("message").path("content"));
        } catch (Exception e) {
            throw new RuntimeException("AI 对话调用失败: " + e.getMessage(), e);
        }
    }

    @Override
    public String chatWithImage(String systemPrompt, List<ChatMessage> history,
                                String userPrompt, String imageBase64, String mimeType) {
        try {
            ObjectNode payload = buildPayload(systemPrompt, history, userPrompt, imageBase64, mimeType, false);
            String body = executeJsonRequest(payload, readTimeoutMs);
            JsonNode root = objectMapper.readTree(body);
            return extractContent(root.path("choices").path(0).path("message").path("content"));
        } catch (Exception e) {
            throw new RuntimeException("AI 图片对话调用失败: " + e.getMessage(), e);
        }
    }

    @Override
    public Flux<String> streamChat(String systemPrompt, List<ChatMessage> history, String userPrompt) {
        return streamPayload(buildPayload(systemPrompt, history, userPrompt, null, null, true));
    }

    @Override
    public Flux<String> streamChatWithImage(String systemPrompt, List<ChatMessage> history,
                                           String userPrompt, String imageBase64, String mimeType) {
        return streamPayload(buildPayload(systemPrompt, history, userPrompt, imageBase64, mimeType, true));
    }

    private Flux<String> streamPayload(ObjectNode payload) {
        return Flux.<String>create(sink -> {
            HttpURLConnection connection = null;
            try {
                connection = openConnection(payload, streamReadTimeoutMs);
                int statusCode = connection.getResponseCode();
                if (statusCode < 200 || statusCode >= 300) {
                    ensureSuccess(statusCode, readResponseBody(connection));
                }

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while (!sink.isCancelled() && (line = reader.readLine()) != null) {
                        String trimmed = line.trim();
                        if (!trimmed.startsWith("data:")) {
                            continue;
                        }
                        String data = trimmed.substring(5).trim();
                        if (data.isEmpty() || "[DONE]".equals(data)) {
                            continue;
                        }
                        JsonNode root = objectMapper.readTree(data);
                        String content = extractDeltaContent(root.path("choices").path(0));
                        if (!content.isEmpty()) {
                            sink.next(content);
                        }
                    }
                }
                if (!sink.isCancelled()) {
                    sink.complete();
                }
            } catch (Exception e) {
                if (!sink.isCancelled()) {
                    sink.error(new RuntimeException("AI 流式调用失败: " + e.getMessage(), e));
                }
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private String executeJsonRequest(ObjectNode payload, int readTimeout) throws Exception {
        HttpURLConnection connection = null;
        try {
            connection = openConnection(payload, readTimeout);
            int statusCode = connection.getResponseCode();
            String body = readResponseBody(connection);
            ensureSuccess(statusCode, body);
            return body;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private HttpURLConnection openConnection(ObjectNode payload, int readTimeout) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) chatCompletionsUrl.openConnection();
        connection.setConnectTimeout(connectTimeoutMs);
        connection.setReadTimeout(readTimeout);
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json");

        String apiKey = aiProperties.getApi() != null ? aiProperties.getApi().getKey() : null;
        if (apiKey != null && !apiKey.isBlank()) {
            connection.setRequestProperty("Authorization", "Bearer " + apiKey);
        }

        byte[] body = payload.toString().getBytes(StandardCharsets.UTF_8);
        connection.setFixedLengthStreamingMode(body.length);
        try (OutputStream outputStream = connection.getOutputStream()) {
            outputStream.write(body);
            outputStream.flush();
        }
        return connection;
    }

    private String readResponseBody(HttpURLConnection connection) throws Exception {
        InputStream stream = null;
        try {
            stream = connection.getResponseCode() >= 400 ? connection.getErrorStream() : connection.getInputStream();
        } catch (Exception ignored) {
            stream = connection.getErrorStream();
        }
        if (stream == null) {
            return "";
        }
        try (InputStream inputStream = stream;
             InputStreamReader reader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
             BufferedReader bufferedReader = new BufferedReader(reader)) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                if (sb.length() > 0) {
                    sb.append('\n');
                }
                sb.append(line);
            }
            return sb.toString();
        }
    }

    private ObjectNode buildPayload(String systemPrompt, List<ChatMessage> history, String userPrompt,
                                    String imageBase64, String mimeType, boolean stream) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", valueOrDefault(aiProperties.getModel(), "gemma-4-e4b-it"));
        payload.put("stream", stream);

        ArrayNode messages = payload.putArray("messages");
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            ObjectNode system = messages.addObject();
            system.put("role", "system");
            system.put("content", systemPrompt);
        }
        appendHistory(messages, history);
        appendUserMessage(messages, userPrompt, imageBase64, mimeType);

        return payload;
    }

    private void appendHistory(ArrayNode messages, List<ChatMessage> history) {
        if (history == null) {
            return;
        }
        for (ChatMessage message : history) {
            if (message == null || message.getContent() == null || message.getContent().isBlank()) {
                continue;
            }
            String role = normalizeRole(message.getRole());
            if (role == null) {
                continue;
            }
            ObjectNode item = messages.addObject();
            item.put("role", role);
            item.put("content", message.getContent());
        }
    }

    private void appendUserMessage(ArrayNode messages, String userPrompt, String imageBase64, String mimeType) {
        ObjectNode user = messages.addObject();
        user.put("role", "user");

        String prompt = userPrompt == null ? "" : userPrompt;
        if (imageBase64 == null || imageBase64.isBlank()) {
            user.put("content", prompt);
            return;
        }

        ArrayNode content = user.putArray("content");
        content.addObject()
                .put("type", "text")
                .put("text", prompt);

        String safeMimeType = (mimeType == null || mimeType.isBlank()) ? "image/jpeg" : mimeType;
        String base64 = imageBase64.trim();
        if (base64.startsWith("data:")) {
            int commaIndex = base64.indexOf(',');
            base64 = commaIndex >= 0 ? base64.substring(commaIndex + 1) : base64;
        }

        ObjectNode imageItem = content.addObject();
        imageItem.put("type", "image_url");
        imageItem.putObject("image_url")
                .put("url", "data:" + safeMimeType + ";base64," + sanitizeBase64(base64));
    }

    private String extractDeltaContent(JsonNode choiceNode) {
        String deltaContent = extractContent(choiceNode.path("delta").path("content"));
        if (!deltaContent.isEmpty()) {
            return deltaContent;
        }
        return extractContent(choiceNode.path("message").path("content"));
    }

    private String extractContent(JsonNode contentNode) {
        if (contentNode == null || contentNode.isMissingNode() || contentNode.isNull()) {
            return "";
        }
        if (contentNode.isTextual()) {
            return contentNode.asText();
        }
        if (contentNode.isArray()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode item : contentNode) {
                if (item == null || item.isNull()) {
                    continue;
                }
                if (item.isTextual()) {
                    sb.append(item.asText());
                    continue;
                }
                String text = item.path("text").asText("");
                if (!text.isEmpty()) {
                    sb.append(text);
                }
            }
            return sb.toString();
        }
        return contentNode.asText("");
    }

    private void ensureSuccess(int statusCode, String body) {
        if (statusCode >= 200 && statusCode < 300) {
            return;
        }
        String message = body == null ? "" : body.trim();
        if (message.length() > 400) {
            message = message.substring(0, 400);
        }
        throw new RuntimeException("LM Studio 响应异常，HTTP " + statusCode + (message.isEmpty() ? "" : "，body=" + message));
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        String normalized = role.trim().toLowerCase();
        if ("assistant".equals(normalized) || "ai".equals(normalized)) {
            return "assistant";
        }
        if ("user".equals(normalized)) {
            return "user";
        }
        return null;
    }

    private String normalizeApiBaseUrl(String baseUrl) {
        String url = valueOrDefault(baseUrl, "http://localhost:1234");
        url = url.trim();
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        if (url.endsWith("/v1")) {
            return url;
        }
        return url + "/v1";
    }

    private String valueOrDefault(String value, String defaultValue) {
        return (value == null || value.isBlank()) ? defaultValue : value;
    }

    private String sanitizeBase64(String base64) {
        String normalized = base64.replaceAll("\\s+", "");
        try {
            Base64.getDecoder().decode(normalized);
            return normalized;
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("图片 base64 数据非法", e);
        }
    }
}
