package com.xxzd.study.mapper;

import com.xxzd.study.domain.DocumentChunk;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface DocumentChunkMapper {

    int insertBatch(List<DocumentChunk> chunks);

    int deleteByDocumentId(@Param("documentId") Long documentId);

    List<DocumentChunk> selectByKeywordsLike(@Param("keywords") List<String> keywords, @Param("limit") int limit);
}
