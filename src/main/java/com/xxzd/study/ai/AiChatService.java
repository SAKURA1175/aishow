package com.xxzd.study.ai;

import java.util.List;
import com.xxzd.study.domain.ChatMessage;

public interface AiChatService {

    String chat(String userPrompt);

    String chat(String systemPrompt, String userPrompt);

    String chat(String systemPrompt, List<ChatMessage> history, String userPrompt);
}
