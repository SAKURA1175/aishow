package com.xxzd.study.mapper;

import com.xxzd.study.domain.DocumentEmbedding;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface DocumentEmbeddingMapper {

    int insert(DocumentEmbedding embedding);

    int deleteByChunkId(@Param("chunkId") Long chunkId);

    /**
     * 根据 chunk_id 列表批量查询向量（用于相似度检索）
     */
    List<DocumentEmbedding> selectByChunkIds(@Param("chunkIds") List<Long> chunkIds);

    /**
     * 查询所有向量（供全量余弦相似度计算）
     */
    List<DocumentEmbedding> selectAll();

    int countAll();

    /**
     * 按文档删除向量
     */
    int deleteByDocumentId(@Param("documentId") Long documentId);
}
