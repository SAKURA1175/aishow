package org.springframework.ai.chat.model;

public interface ChatModel {
    String call(String message);
}
