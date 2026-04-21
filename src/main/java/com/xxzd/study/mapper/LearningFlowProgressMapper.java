package com.xxzd.study.mapper;

import com.xxzd.study.domain.LearningFlowProgress;
import org.apache.ibatis.annotations.Param;

public interface LearningFlowProgressMapper {

    int insert(LearningFlowProgress progress);

    LearningFlowProgress selectByUserAndFlow(@Param("userId") Long userId,
                                             @Param("flowType") String flowType);

    int updateProgress(@Param("id") Long id,
                       @Param("currentStep") int currentStep,
                       @Param("stepData") String stepData,
                       @Param("status") String status);
}
