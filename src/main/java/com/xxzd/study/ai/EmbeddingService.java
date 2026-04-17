package com.xxzd.study.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxzd.study.config.properties.AiProperties;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * BGE-M3 Embedding 服务
 * 通过 LM Studio OpenAI 兼容接口 /v1/embeddings 获取文本向量
 */
@Service
public class EmbeddingService {

    // BGE-M3 在 LM Studio 中的模型 ID
    private static final String EMBED_MODEL = "text-embedding-bge-m3";

    private final AiProperties aiProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public EmbeddingService(AiProperties aiProperties) {
        this.aiProperties = aiProperties;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 对单段文本生成 1024 维向量
     *
     * @param text 输入文本
     * @return float 数组，长度 1024
     */
    public float[] embed(String text) {
        String url = aiProperties.getApi().getUrl() + "/v1/embeddings";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(aiProperties.getApi().getKey());

        Map<String, Object> body = Map.of(
                "model", EMBED_MODEL,
                "input", text
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode embeddingNode = root.path("data").get(0).path("embedding");

            float[] vector = new float[embeddingNode.size()];
            for (int i = 0; i < embeddingNode.size(); i++) {
                vector[i] = (float) embeddingNode.get(i).asDouble();
            }
            return vector;
        } catch (Exception e) {
            throw new RuntimeException("Embedding 调用失败: " + e.getMessage(), e);
        }
    }

    /**
     * 批量向量化（每次单独调用以保证稳定性）
     */
    public List<float[]> embedBatch(List<String> texts) {
        return texts.stream().map(this::embed).toList();
    }

    /**
     * 计算两个向量的余弦相似度
     */
    public static float cosineSimilarity(float[] a, float[] b) {
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot   += (double) a[i] * b[i];
            normA += (double) a[i] * a[i];
            normB += (double) b[i] * b[i];
        }
        double denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom == 0 ? 0f : (float) (dot / denom);
    }

    /**
     * 将 float[] 序列化为 JSON 字符串（存 DB）
     */
    public static String toJson(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(vector[i]);
        }
        return sb.append(']').toString();
    }

    /**
     * 从 JSON 字符串反序列化为 float[]（读 DB）
     */
    public static float[] fromJson(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(json);
            float[] v = new float[node.size()];
            for (int i = 0; i < node.size(); i++) {
                v[i] = (float) node.get(i).asDouble();
            }
            return v;
        } catch (Exception e) {
            throw new RuntimeException("向量反序列化失败", e);
        }
    }
}
