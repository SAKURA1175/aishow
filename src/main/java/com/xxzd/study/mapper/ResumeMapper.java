package com.xxzd.study.mapper;

import com.xxzd.study.domain.Resume;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ResumeMapper {

    int insert(Resume resume);

    Resume selectById(@Param("id") Long id);

    List<Resume> selectByUserId(@Param("userId") Long userId);

    int updateAnalysis(@Param("id") Long id,
                       @Param("structuredJson") String structuredJson,
                       @Param("analysisJson") String analysisJson,
                       @Param("score") Integer score);

    int updateGapAnalysis(@Param("id") Long id,
                          @Param("targetRole") String targetRole,
                          @Param("gapAnalysis") String gapAnalysis);

    int updateCanvaData(@Param("id") Long id,
                        @Param("canvaData") String canvaData);

    int deleteById(@Param("id") Long id);
}
