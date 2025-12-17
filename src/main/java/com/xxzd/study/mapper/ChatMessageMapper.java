package com.xxzd.study.mapper;

import com.xxzd.study.domain.ChatMessage;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ChatMessageMapper {

    int insert(ChatMessage message);

    List<ChatMessage> selectBySessionId(@Param("sessionId") Long sessionId);
}

