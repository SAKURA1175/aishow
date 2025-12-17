package com.xxzd.study.mapper;

import com.xxzd.study.domain.Document;
import org.apache.ibatis.annotations.Param;

public interface DocumentMapper {

    int insert(Document document);

    Document selectById(Long id);

    java.util.List<Document> selectAllOrderByTime();

    int deleteById(Long id);

    int updateStoredFilename(@Param("id") Long id, @Param("storedFilename") String storedFilename);
}
