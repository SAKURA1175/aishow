package com.xxzd.study.controller;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        // 调用真实的 AI API 获取回答
        String answer = chatService.getAiAnswer(content);
        ChatSession chatSession = chatService.createSessionIfAbsent(user, content, question.getSessionId());
        chatService.saveMessage(chatSession.getId(), "user", content);
        chatService.saveMessage(chatSession.getId(), "ai", answer);
        learningProfileService.recordQuestion(user, content);
        ChatAnswer chatAnswer = new ChatAnswer();
        chatAnswer.setAnswer(answer);
        chatAnswer.setSessionId(chatSession.getId());
        return ApiResponse.ok(chatAnswer);
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
