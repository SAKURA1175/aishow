package com.xxzd.study.service.impl;

import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.UserMapper;
import com.xxzd.study.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;

@Service
public class UserServiceImpl implements UserService {

    @Resource
    private UserMapper userMapper;

    @Override
    @Transactional
    public User login(String username, String password, String role) {
        User exist = userMapper.selectByUsername(username);
        if (exist == null) {
            User toInsert = new User();
            toInsert.setUsername(username);
            toInsert.setPassword(password);
            toInsert.setRole(role != null && !role.isEmpty() ? role : "student");
            userMapper.insert(toInsert);
            return toInsert;
        }
        if (!exist.getPassword().equals(password)) {
            return null;
        }
        return exist;
    }
}

