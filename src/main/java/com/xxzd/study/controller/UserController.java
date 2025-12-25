package com.xxzd.study.controller;

import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.User;
import com.xxzd.study.service.UserService;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Resource
    private UserService userService;

    @PostMapping("/login")
    public ApiResponse<UserInfo> login(@RequestBody LoginRequest request, HttpSession session) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            return ApiResponse.fail("用户名或密码不能为空");
        }
        User user = userService.login(request.getUsername(), request.getPassword(), request.getRole());
        if (user == null) {
            return ApiResponse.fail("用户名或密码错误");
        }
        session.setAttribute("currentUser", user);
        UserInfo info = new UserInfo();
        info.setId(user.getId());
        info.setUsername(user.getUsername());
        info.setRole(user.getRole());
        return ApiResponse.ok("登录成功", info);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
        return ApiResponse.ok(null);
    }

    @GetMapping("/profile")
    public ApiResponse<UserInfo> profile(HttpSession session) {
        Object current = session.getAttribute("currentUser");
        if (!(current instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        User user = (User) current;
        UserInfo info = new UserInfo();
        info.setId(user.getId());
        info.setUsername(user.getUsername());
        info.setRole(user.getRole());
        return ApiResponse.ok(info);
    }

    public static class LoginRequest {

        private String username;

        private String password;

        private String role;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }

    public static class UserInfo {

        private Long id;

        private String username;

        private String role;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}
