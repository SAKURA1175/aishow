package com.xxzd.study.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Chroma v2 向量数据库客户端
 * API: /api/v2/tenants/{tenant}/databases/{database}/collections/...
 */
@Component
public class ChromaVectorStore {

    private static final String BASE_URL  = "http://localhost:8000/api/v2";
    private static final String TENANT    = "default_tenant";
    private static final String DATABASE  = "default_database";
    private static final String COL_NAME  = "study_docs";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper       = new ObjectMapper();

    /** 集合 ID 缓存（懒加载） */
    private volatile String collectionId = null;

    private String colBase() {
        return BASE_URL + "/tenants/" + TENANT + "/databases/" + DATABASE + "/collections";
    }

    // ── 初始化：确保集合存在 ──────────────────────────────────────────────────

    public String getOrCreateCollection() {
        if (collectionId != null) return collectionId;
        synchronized (this) {
            if (collectionId != null) return collectionId;
            collectionId = fetchOrCreate();
        }
        return collectionId;
    }

    private String fetchOrCreate() {
        // 1. 确保 tenant 存在
        ensureTenant();
        // 2. 确保 database 存在
        ensureDatabase();
        // 3. 获取或创建集合
        return fetchOrCreateCollection();
    }

    private void ensureTenant() {
        try {
            restTemplate.getForEntity(BASE_URL + "/tenants/" + TENANT, String.class);
        } catch (HttpClientErrorException.NotFound e) {
            try {
                ObjectNode body = mapper.createObjectNode();
                body.put("name", TENANT);
                post(BASE_URL + "/tenants", body);
            } catch (Exception ignored) {}
        } catch (Exception ignored) {}
    }

    private void ensureDatabase() {
        String url = BASE_URL + "/tenants/" + TENANT + "/databases/" + DATABASE;
        try {
            restTemplate.getForEntity(url, String.class);
        } catch (HttpClientErrorException.NotFound e) {
            try {
                ObjectNode body = mapper.createObjectNode();
                body.put("name", DATABASE);
                post(BASE_URL + "/tenants/" + TENANT + "/databases", body);
            } catch (Exception ignored) {}
        } catch (Exception ignored) {}
    }

    private String fetchOrCreateCollection() {
        // 先尝试按名字获取
        try {
            String url = colBase() + "/" + COL_NAME;
            ResponseEntity<String> resp = restTemplate.getForEntity(url, String.class);
            JsonNode node = mapper.readTree(resp.getBody());
            return node.path("id").asText();
        } catch (HttpClientErrorException.NotFound ignored) {
            // 不存在则创建
        } catch (Exception e) {
            throw new RuntimeException("Chroma: 获取集合失败 " + e.getMessage());
        }

        // 创建
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("name", COL_NAME);
            ObjectNode meta = mapper.createObjectNode();
            meta.put("hnsw:space", "cosine");
            body.set("metadata", meta);

            ResponseEntity<String> resp = post(colBase(), body);
            JsonNode node = mapper.readTree(resp.getBody());
            return node.path("id").asText();
        } catch (Exception e) {
            throw new RuntimeException("Chroma: 创建集合失败 " + e.getMessage());
        }
    }

    // ── 写入向量 ────────────────────────────────────────────────────────────────

    public void upsert(String id, float[] vector, String content, Map<String, Object> metadata) {
        try {
            String colId = getOrCreateCollection();

            ObjectNode body = mapper.createObjectNode();

            ArrayNode ids = body.putArray("ids");
            ids.add(id);

            ArrayNode embeddings = body.putArray("embeddings");
            ArrayNode vecArr = embeddings.addArray();
            for (float v : vector) vecArr.add(v);

            ArrayNode documents = body.putArray("documents");
            documents.add(content == null ? "" : content);

            ArrayNode metadatas = body.putArray("metadatas");
            ObjectNode meta = metadatas.addObject();
            if (metadata != null) {
                metadata.forEach((k, v) -> {
                    if (v instanceof Long)         meta.put(k, (Long) v);
                    else if (v instanceof Integer) meta.put(k, (Integer) v);
                    else                           meta.put(k, String.valueOf(v));
                });
            }

            post(colBase() + "/" + colId + "/upsert", body);
        } catch (Exception e) {
            throw new RuntimeException("Chroma upsert 失败: " + e.getMessage(), e);
        }
    }

    // ── 查询向量 ────────────────────────────────────────────────────────────────

    public List<ChromaResult> query(float[] queryVector, int topK) {
        try {
            String colId = getOrCreateCollection();

            ObjectNode body = mapper.createObjectNode();
            ArrayNode qe = body.putArray("query_embeddings");
            ArrayNode va = qe.addArray();
            for (float v : queryVector) va.add(v);
            body.put("n_results", topK);
            ArrayNode include = body.putArray("include");
            include.add("documents");
            include.add("metadatas");
            include.add("distances");

            ResponseEntity<String> resp = post(colBase() + "/" + colId + "/query", body);
            return parseQueryResult(resp.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Chroma query 失败: " + e.getMessage(), e);
        }
    }

    private List<ChromaResult> parseQueryResult(String json) throws Exception {
        JsonNode root = mapper.readTree(json);
        JsonNode idsArr       = root.path("ids").get(0);
        JsonNode docsArr      = root.path("documents").get(0);
        JsonNode metasArr     = root.path("metadatas").get(0);
        JsonNode distancesArr = root.path("distances").get(0);

        List<ChromaResult> results = new ArrayList<>();
        if (idsArr == null) return results;

        for (int i = 0; i < idsArr.size(); i++) {
            ChromaResult r = new ChromaResult();
            r.id       = idsArr.get(i).asText();
            r.document = docsArr != null ? docsArr.get(i).asText() : "";
            r.distance = distancesArr != null ? (float) distancesArr.get(i).asDouble() : 1f;
            r.metadata = new HashMap<>();
            if (metasArr != null && metasArr.get(i) != null) {
                metasArr.get(i).fields().forEachRemaining(
                        e -> r.metadata.put(e.getKey(), e.getValue().asText()));
            }
            results.add(r);
        }
        return results;
    }

    // ── 删除 ────────────────────────────────────────────────────────────────────

    public void delete(String id) {
        try {
            String colId = getOrCreateCollection();
            ObjectNode body = mapper.createObjectNode();
            body.putArray("ids").add(id);
            post(colBase() + "/" + colId + "/delete", body);
        } catch (Exception ignored) {}
    }

    public void deleteByDocumentId(Long documentId) {
        try {
            String colId = getOrCreateCollection();
            ObjectNode body = mapper.createObjectNode();
            ObjectNode where = body.putObject("where");
            where.putObject("documentId").put("$eq", String.valueOf(documentId));
            post(colBase() + "/" + colId + "/delete", body);
        } catch (Exception ignored) {}
    }

    // ── 工具方法 ────────────────────────────────────────────────────────────────

    private ResponseEntity<String> post(String url, ObjectNode body) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(body), headers);
        return restTemplate.postForEntity(url, entity, String.class);
    }

    // ── Result DTO ───────────────────────────────────────────────────────────────

    public static class ChromaResult {
        public String id;
        public String document;
        public float  distance;
        public Map<String, String> metadata;

        /** cosine 相似度 = 1 - distance */
        public float similarity() { return 1f - distance; }
    }
}
