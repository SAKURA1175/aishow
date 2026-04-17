package com.xxzd.study.mapper;

import com.xxzd.study.domain.DocumentChunk;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface DocumentChunkMapper {

    int insertBatch(List<DocumentChunk> chunks);

    int deleteByDocumentId(@Param("documentId") Long documentId);

    List<DocumentChunk> selectByKeywordsLike(@Param("keywords") List<String> keywords, @Param("limit") int limit);

    /** 向量 RAG 用：按 ID 列表批量查询 chunk 内容 */
    List<DocumentChunk> selectByIds(@Param("ids") List<Long> ids);

    /** 查询某文档的所有 chunk，供向量化时使用 */
    List<DocumentChunk> selectByDocumentId(@Param("documentId") Long documentId);
}
