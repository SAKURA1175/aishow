package com.xxzd.study.mapper;

import com.xxzd.study.domain.LearningProfile;
import org.apache.ibatis.annotations.Param;

public interface LearningProfileMapper {

    LearningProfile selectByUserId(@Param("userId") Long userId);

    int insert(LearningProfile profile);

    int update(LearningProfile profile);
}

