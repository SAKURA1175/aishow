package com.xxzd.study.security;

import com.xxzd.study.config.WebConfig;
import com.xxzd.study.controller.ChatController;
import com.xxzd.study.interceptor.LoginInterceptor;
import com.xxzd.study.service.ChatService;
import com.xxzd.study.service.LearningProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ChatController.class)
@Import({WebConfig.class, LoginInterceptor.class})
public class LoginInterceptorContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChatService chatService;

    @MockBean
    private LearningProfileService learningProfileService;

    @Test
    void apiWithoutLoginReturns401WithExpectedBody() throws Exception {
        mockMvc.perform(get("/api/chat/sessions"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("{\"success\":false,\"message\":\"请先登录后再操作\"}"));
    }
}

