package com.xxzd.study.resume;

import com.xxzd.study.ai.ChromaVectorStore;
import com.xxzd.study.ai.EmbeddingService;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 简历专属知识库服务
 * 使用 ChromaDB 的独立 resume_kb collection，与 study_docs 完全隔离
 */
@Service
public class ResumeKbService {

    /** 与学习知识库完全隔离的独立 collection */
    private static final String RESUME_COLLECTION = "resume_kb";

    @Resource
    private ChromaVectorStore chromaVectorStore;

    @Resource
    private EmbeddingService embeddingService;

    /** 懒加载的隔离 collection 视图 */
    private volatile ChromaVectorStore resumeStore;

    private ChromaVectorStore getStore() {
        if (resumeStore == null) {
            synchronized (this) {
                if (resumeStore == null) {
                    resumeStore = chromaVectorStore.withCollection(RESUME_COLLECTION);
                }
            }
        }
        return resumeStore;
    }

    /**
     * 向简历知识库写入一段文档
     */
    public void index(String docId, String content, Map<String, Object> metadata) {
        try {
            float[] vec = embeddingService.embed(content);
            getStore().upsert(docId, vec, content, metadata);
        } catch (Exception e) {
            System.err.println("[ResumeKb] 写入失败: " + e.getMessage());
        }
    }

    /**
     * 语义检索：检索最相关的简历写作知识片段
     */
    public List<String> search(String query, int topK) {
        try {
            float[] vec = embeddingService.embed(query);
            List<ChromaVectorStore.ChromaResult> results = getStore().query(vec, topK);
            return results.stream()
                    .filter(r -> r.distance < 0.65f)
                    .map(r -> r.document)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("[ResumeKb] 检索失败: " + e.getMessage());
            return List.of();
        }
    }

    /**
     * 预置知识条目（启动时或管理后台调用）
     */
    public void indexKnowledgeEntry(String id, String title, String content) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("title", title);
        meta.put("source", "resume_kb");
        index("kb_" + id, content, meta);
    }
}
