package com.xxzd.study.service;

import com.xxzd.study.domain.User;

public interface UserService {

    /**
     * 登录（如果不存在则自动注册）
     * @param username 用户名
     * @param password 密码
     * @param role 角色
     * @return 用户对象，登录失败返回 null
     */
    User login(String username, String password, String role);
}

