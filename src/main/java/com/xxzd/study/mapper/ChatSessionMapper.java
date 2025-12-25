package com.xxzd.study.mapper;

import com.xxzd.study.domain.ChatSession;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ChatSessionMapper {

    int insert(ChatSession session);

    ChatSession selectById(@Param("id") Long id);

    List<ChatSession> selectByUserId(@Param("userId") Long userId);

    int deleteByUserId(@Param("userId") Long userId);
}

