package com.xxzd.study.ai;

import com.xxzd.study.domain.DocumentChunk;
import com.xxzd.study.domain.DocumentEmbedding;
import com.xxzd.study.mapper.DocumentChunkMapper;
import com.xxzd.study.mapper.DocumentEmbeddingMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * MySQL 向量检索降级实现
 * 当 Chroma 不可用时，从 document_embedding 表全量加载并做余弦相似度计算
 */
@Component
public class DocumentEmbeddingFallback {

    private static final float THRESHOLD = 0.3f;

    @Resource
    private DocumentEmbeddingMapper documentEmbeddingMapper;

    @Resource
    private DocumentChunkMapper documentChunkMapper;

    public List<DocumentChunk> search(float[] queryVec, int topK) {
        List<DocumentEmbedding> all = documentEmbeddingMapper.selectAll();
        if (all == null || all.isEmpty()) return Collections.emptyList();

        List<long[]> scored = new ArrayList<>();
        for (DocumentEmbedding emb : all) {
            try {
                float[] vec = EmbeddingService.fromJson(emb.getVectorJson());
                float sim = EmbeddingService.cosineSimilarity(queryVec, vec);
                if (sim >= THRESHOLD) {
                    // store chunkId + similarity as long bits
                    scored.add(new long[]{emb.getChunkId(), Float.floatToIntBits(sim)});
                }
            } catch (Exception ignored) {}
        }
        if (scored.isEmpty()) return Collections.emptyList();

        scored.sort((a, b) -> Float.compare(
                Float.intBitsToFloat((int) b[1]),
                Float.intBitsToFloat((int) a[1])
        ));

        List<Long> ids = scored.stream().limit(topK).map(a -> a[0]).collect(Collectors.toList());
        List<DocumentChunk> chunks = documentChunkMapper.selectByIds(ids);
        if (chunks == null) return Collections.emptyList();

        Map<Long, DocumentChunk> map = new HashMap<>();
        chunks.forEach(c -> map.put(c.getId(), c));
        return ids.stream().map(map::get).filter(Objects::nonNull).collect(Collectors.toList());
    }
}
