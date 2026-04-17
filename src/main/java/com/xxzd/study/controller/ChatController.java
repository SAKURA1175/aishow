package com.xxzd.study.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.ChatMessage;
import com.xxzd.study.domain.ChatSession;
import com.xxzd.study.domain.User;
import com.xxzd.study.service.ChatService;
import com.xxzd.study.service.LearningProfileService;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Resource
    private ChatService chatService;

    @Resource
    private LearningProfileService learningProfileService;

    @PostMapping("/ask")
    public ApiResponse<ChatAnswer> ask(@RequestBody ChatQuestion question, HttpSession session) {
        if (question == null || question.getQuestion() == null || question.getQuestion().trim().isEmpty()) {
            return ApiResponse.fail("问题不能为空");
        }
        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        User user = (User) userObj;
        String content = question.getQuestion().trim();
        // 1. 创建或获取会话（优先确保会话存在）
        ChatSession chatSession = chatService.createSessionIfAbsent(user, content, question.getSessionId());
        
        // 2. 立即保存用户的提问，防止AI调用失败导致记录丢失
        chatService.saveMessage(chatSession.getId(), "user", content);
        
        // 3. 调用真实的 AI API 获取回答
        String answer;
        try {
            answer = chatService.getAiAnswer(user, content, chatSession.getId());
        } catch (Exception e) {
            answer = "抱歉，AI服务暂时不可用，请稍后再试。错误信息：" + e.getMessage();
        }

        // 4. 保存 AI 的回答
        chatService.saveMessage(chatSession.getId(), "ai", answer);
        
        learningProfileService.recordQuestion(user, content);
        
        ChatAnswer chatAnswer = new ChatAnswer();
        chatAnswer.setAnswer(answer);
        chatAnswer.setSessionId(chatSession.getId());
        return ApiResponse.ok(chatAnswer);
    }

    /**
     * SSE 流式接口：逐 token 推送 AI 回答
     * GET /api/chat/stream?question=xxx[&sessionId=xxx]
     */
    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter stream(@RequestParam("question") String question,
                              @RequestParam(required = false) Long sessionId,
                              @RequestParam(required = false, defaultValue = "false") boolean deepThink,
                              HttpSession session) {
        SseEmitter emitter = new SseEmitter(300_000L); // 5分钟，深度思考模式下模型生成较慢

        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof com.xxzd.study.domain.User user)) {
            try { emitter.send(SseEmitter.event().data("[ERROR] 未登录")); } catch (Exception ignored) {}
            emitter.complete();
            return emitter;
        }

        if (question == null || question.trim().isEmpty()) {
            try { emitter.send(SseEmitter.event().data("[ERROR] 问题不能为空")); } catch (Exception ignored) {}
            emitter.complete();
            return emitter;
        }

        final String q = question.trim();
        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.submit(() -> streamAnswer(emitter, user, q, sessionId, null, null, deepThink));
        executor.shutdown();
        return emitter;
    }

    /**
     * 多模态 SSE 接口：支持上传图片
     * POST /api/chat/stream-vision  Body: { question, sessionId?, imageBase64, mimeType }
     */
    @PostMapping(value = "/stream-vision", produces = "text/event-stream")
    public SseEmitter streamVision(@RequestBody VisionRequest req, HttpSession session) {
        SseEmitter emitter = new SseEmitter(180_000L); // 3 分钟（图片分析可能更慢）

        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof com.xxzd.study.domain.User user)) {
            try { emitter.send(SseEmitter.event().data("[ERROR] 未登录")); } catch (Exception ignored) {}
            emitter.complete();
            return emitter;
        }

        if (req == null || req.getQuestion() == null || req.getQuestion().trim().isEmpty()) {
            try { emitter.send(SseEmitter.event().data("[ERROR] 问题不能为空")); } catch (Exception ignored) {}
            emitter.complete();
            return emitter;
        }

        if (req.getImageBase64() == null || req.getImageBase64().isBlank()) {
            // 无图片则降级走普通流
            final String q = req.getQuestion().trim();
            final boolean deepThink = req.getDeepThink() != null && req.getDeepThink();
            ExecutorService executor = Executors.newSingleThreadExecutor();
            executor.submit(() -> streamAnswer(emitter, user, q, req.getSessionId(), null, null, deepThink));
            executor.shutdown();
            return emitter;
        }

        final String q = req.getQuestion().trim();
        final String ib64 = req.getImageBase64();
        final String mt = req.getMimeType();
        final boolean deepThink = req.getDeepThink() != null && req.getDeepThink();
        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.submit(() -> streamAnswer(emitter, user, q, req.getSessionId(), ib64, mt, deepThink));
        executor.shutdown();
        return emitter;
    }

    /** 通用 SSE 推送逻辑（纯文字 or 多模态复用同一方法） */
    private void streamAnswer(SseEmitter emitter, com.xxzd.study.domain.User user,
                               String q, Long sessionId, String imageBase64, String mimeType, boolean deepThink) {
        try {
            com.xxzd.study.domain.ChatSession chatSession =
                    chatService.createSessionIfAbsent(user, q, sessionId);
            long sid = chatSession.getId();

            emitter.send(SseEmitter.event()
                    .name("meta")
                    .data("{\"sessionId\":\"" + sid + "\"}"));

            // 保存用户消息（含图片标注）
            String userContent = (imageBase64 != null && !imageBase64.isBlank())
                    ? "[图片] " + q
                    : q;
            chatService.saveMessage(sid, "user", userContent);

            // 调用 AI (真流式)
            reactor.core.publisher.Flux<String> flux;
            try {
                if (imageBase64 != null && !imageBase64.isBlank()) {
                    flux = chatService.streamAiAnswerWithImage(user, q, sid, imageBase64, mimeType, deepThink);
                } else {
                    flux = chatService.streamAiAnswer(user, q, sid, deepThink);
                }
            } catch (Exception e) {
                flux = reactor.core.publisher.Flux.just("抱歉，AI服务暂时不可用。" + e.getMessage());
            }

            StringBuilder fullAnswerBuilder = new StringBuilder();

            flux.subscribe(
                    chunk -> {
                        try {
                            if (chunk != null) {
                                fullAnswerBuilder.append(chunk);
                                // 把换行符转义，防止破坏 SSE 结构
                                String safeChunk = chunk.replace("\n", "\\n");
                                emitter.send(SseEmitter.event().data(safeChunk));
                            }
                        } catch (Exception e) {
                            emitter.completeWithError(e);
                        }
                    },
                    err -> {
                        try {
                            emitter.send(SseEmitter.event().data("\n[出错: " + err.getMessage() + "]"));
                            emitter.send(SseEmitter.event().data("[DONE]"));
                            emitter.complete();
                        } catch (Exception ignored) {}
                        chatService.saveMessage(sid, "ai", fullAnswerBuilder.toString() + "\n[Error]");
                    },
                    () -> {
                        try {
                            emitter.send(SseEmitter.event().data("[DONE]"));
                            emitter.complete();
                        } catch (Exception ignored) {}
                        chatService.saveMessage(sid, "ai", fullAnswerBuilder.toString());
                        // recordQuestion 会调用 AI 分析画像，可以异步执行，这里交给它内部处理
                        learningProfileService.recordQuestion(user, q);
                    }
            );

        } catch (Exception e) {
            emitter.completeWithError(e);
        }
    }

    @PostMapping("/new")
    public ApiResponse<ChatSession> newSession(HttpSession session) {
        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        User user = (User) userObj;
        ChatSession newSession = chatService.createSession(user, "新的对话");
        return ApiResponse.ok(newSession);
    }
    
    @GetMapping("/latest")
    public ApiResponse<ChatSession> getLatestSession(HttpSession session) {
        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        User user = (User) userObj;
        List<ChatSession> sessions = chatService.listSessionsByUser(user.getId());
        if (sessions != null && !sessions.isEmpty()) {
            // 返回最新的一次对话
            return ApiResponse.ok(sessions.get(0));
        }
        return ApiResponse.ok(null);
    }

    @GetMapping("/sessions")
    public ApiResponse<List<ChatSessionView>> listSessions(HttpSession session) {
        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        User user = (User) userObj;
        List<ChatSession> sessions = chatService.listSessionsByUser(user.getId());
        List<ChatSessionView> list = new ArrayList<>();
        for (ChatSession s : sessions) {
            ChatSessionView v = new ChatSessionView();
            v.setId(s.getId());
            v.setTitle(s.getTitle());
            v.setCreateTime(s.getCreateTime());
            list.add(v);
        }
        return ApiResponse.ok(list);
    }

    @GetMapping("/messages/{sessionId}")
    public ApiResponse<List<ChatMessageView>> listMessages(@PathVariable("sessionId") Long sessionId, HttpSession session) {
        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        List<ChatMessage> messages = chatService.listMessagesBySession(sessionId);
        List<ChatMessageView> list = new ArrayList<>();
        for (ChatMessage m : messages) {
            ChatMessageView v = new ChatMessageView();
            v.setId(m.getId());
            v.setRole(m.getRole());
            v.setContent(m.getContent());
            v.setCreateTime(m.getCreateTime());
            list.add(v);
        }
        return ApiResponse.ok(list);
    }

    @DeleteMapping("/clear")
    public ApiResponse<Void> clearSessions(HttpSession session) {
        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        User user = (User) userObj;
        
        chatService.clearUserSessions(user.getId());
        return ApiResponse.ok(null);
    }

    public static class VisionRequest {
        private String question;
        private Long sessionId;
        private String imageBase64;
        private String mimeType;
        private Boolean deepThink;

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public String getImageBase64() { return imageBase64; }
        public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
        public String getMimeType() { return mimeType; }
        public void setMimeType(String mimeType) { this.mimeType = mimeType; }
        public Boolean getDeepThink() { return deepThink; }
        public void setDeepThink(Boolean deepThink) { this.deepThink = deepThink; }
    }

    public static class ChatQuestion {

        private String question;

        private Long sessionId;

        public String getQuestion() {
            return question;
        }

        public void setQuestion(String question) {
            this.question = question;
        }

        public Long getSessionId() {
            return sessionId;
        }

        public void setSessionId(Long sessionId) {
            this.sessionId = sessionId;
        }
    }

    public static class ChatAnswer {

        private String answer;

        private Long sessionId;

        public String getAnswer() {
            return answer;
        }

        public void setAnswer(String answer) {
            this.answer = answer;
        }

        public Long getSessionId() {
            return sessionId;
        }

        public void setSessionId(Long sessionId) {
            this.sessionId = sessionId;
        }
    }

    public static class ChatSessionView {

        private Long id;

        private String title;

        private java.util.Date createTime;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public java.util.Date getCreateTime() {
            return createTime;
        }

        public void setCreateTime(java.util.Date createTime) {
            this.createTime = createTime;
        }
    }

    public static class ChatMessageView {

        private Long id;

        private String role;

        private String content;

        private java.util.Date createTime;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public java.util.Date getCreateTime() {
            return createTime;
        }

        public void setCreateTime(java.util.Date createTime) {
            this.createTime = createTime;
        }
    }
}
