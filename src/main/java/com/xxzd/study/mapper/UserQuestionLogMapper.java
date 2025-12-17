package com.xxzd.study.mapper;

import com.xxzd.study.domain.UserQuestionLog;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface UserQuestionLogMapper {

    int insert(UserQuestionLog log);

    List<UserQuestionLog> selectRecentByUser(@Param("userId") Long userId, @Param("limit") int limit);
}

