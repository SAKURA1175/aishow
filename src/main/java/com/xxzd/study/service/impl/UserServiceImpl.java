package com.xxzd.study.service.impl;

import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.UserMapper;
import com.xxzd.study.service.UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.Resource;

@Service
public class UserServiceImpl implements UserService {

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Resource
    private UserMapper userMapper;

    @Override
    @Transactional
    public User login(String username, String password, String role) {
        User exist = userMapper.selectByUsername(username);
        if (exist == null) {
            if (!isStudentRole(role)) {
                return null;
            }
            User toInsert = new User();
            toInsert.setUsername(username);
            toInsert.setPassword(passwordEncoder.encode(password));
            toInsert.setRole("student");
            userMapper.insert(toInsert);
            return toInsert;
        }
        if (!passwordMatches(password, exist.getPassword())) {
            return null;
        }
        return exist;
    }

    @Override
    @Transactional
    public User register(String username, String password, String role) {
        if (!isStudentRole(role)) {
            throw new RuntimeException("教师账号请联系管理员开通，暂不支持自助注册");
        }
        User exist = userMapper.selectByUsername(username);
        if (exist != null) {
            throw new RuntimeException("用户名已存在");
        }
        User toInsert = new User();
        toInsert.setUsername(username);
        toInsert.setPassword(passwordEncoder.encode(password));
        toInsert.setRole("student");
        userMapper.insert(toInsert);
        return toInsert;
    }

    private boolean isStudentRole(String role) {
        return role == null || role.isEmpty() || "student".equals(role);
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (storedPassword == null) {
            return false;
        }
        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        return storedPassword.equals(rawPassword);
    }
}
