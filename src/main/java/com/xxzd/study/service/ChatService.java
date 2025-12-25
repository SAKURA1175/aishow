package com.xxzd.study.service;

import java.util.List;

import com.xxzd.study.domain.ChatMessage;
import com.xxzd.study.domain.ChatSession;
import com.xxzd.study.domain.User;

public interface ChatService {

    ChatSession createSessionIfAbsent(User user, String title, Long sessionId);
    
    ChatSession createSession(User user, String title);

    void saveMessage(Long sessionId, String role, String content);

    List<ChatSession> listSessionsByUser(Long userId);

    List<ChatMessage> listMessagesBySession(Long sessionId);

    void clearUserSessions(Long userId);

    String getAiAnswer(User user, String prompt, Long sessionId);
}

