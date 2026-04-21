package com.xxzd.study.ai;

import com.xxzd.study.config.properties.AiProperties;
import com.xxzd.study.domain.DocumentChunk;
import com.xxzd.study.mapper.DocumentChunkMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 向量 RAG 检索服务（Chroma 版）
 * 优先走 Chroma，不可用时降级到 MySQL 余弦相似度
 */
@Service
public class VectorRagService {

    // Chroma 距离阈值：cosine distance < 0.6 才算相关（即相似度 > 0.4）
    private static final float MAX_DISTANCE = 0.6f;

    @Resource
    private EmbeddingService embeddingService;

    @Resource
    private ChromaVectorStore chromaStore;

    @Resource
    private DocumentEmbeddingFallback fallback;

    @Resource
    private DocumentChunkMapper documentChunkMapper;

    @Resource
    private AiProperties aiProperties;

    /**
     * 语义检索：找出与 query 最相似的 Top-K 文档片段
     */
    public List<DocumentChunk> search(String query, int topK) {
        if (query == null || query.trim().isEmpty()) return Collections.emptyList();

        // 1. 问题向量化
        float[] queryVec;
        try {
            queryVec = embeddingService.embed(query);
        } catch (Exception e) {
            System.err.println("[VectorRAG] embedding 失败，跳过向量检索: " + e.getMessage());
            return Collections.emptyList();
        }

        // 2. Chroma 语义检索
        try {
            List<ChromaVectorStore.ChromaResult> results = chromaStore.query(queryVec, topK);
            List<Long> chunkIds = results.stream()
                    .filter(r -> r.distance < MAX_DISTANCE)
                    .map(r -> {
                        String idStr = r.metadata.getOrDefault("chunkId", "0");
                        try { return Long.parseLong(idStr); } catch (Exception ex) { return 0L; }
                    })
                    .filter(id -> id > 0)
                    .collect(Collectors.toList());

            if (!chunkIds.isEmpty()) {
                List<DocumentChunk> chunks = documentChunkMapper.selectByIds(chunkIds);
                if (chunks != null && !chunks.isEmpty()) {
                    // 按 Chroma 返回顺序重排（相似度降序）
                    Map<Long, DocumentChunk> map = new HashMap<>();
                    chunks.forEach(c -> map.put(c.getId(), c));
                    return chunkIds.stream().map(map::get).filter(Objects::nonNull).collect(Collectors.toList());
                }
            }
        } catch (Exception e) {
            System.err.println("[VectorRAG] Chroma 查询失败，降级到 MySQL: " + e.getMessage());
        }

        // 3. 降级：MySQL 全量余弦相似度
        int maxScanRows = aiProperties.getRag() != null
                ? aiProperties.getRag().getMaxFallbackScanRows()
                : 2000;
        return fallback.search(queryVec, topK, maxScanRows);
    }

    /**
     * 将 chunk 写入 Chroma（供文档上传时调用）
     */
    public void indexChunk(DocumentChunk chunk, float[] vector) {
        String id = "chunk_" + chunk.getId();
        Map<String, Object> meta = new HashMap<>();
        meta.put("chunkId",    String.valueOf(chunk.getId()));
        meta.put("documentId", String.valueOf(chunk.getDocumentId()));
        meta.put("chunkIndex", String.valueOf(chunk.getChunkIndex()));

        chromaStore.upsert(id, vector, chunk.getContent(), meta);
    }

    /**
     * 删除某文档的所有向量（文档删除时调用）
     */
    public void deleteByDocument(Long documentId) {
        chromaStore.deleteByDocumentId(documentId);
    }
}
