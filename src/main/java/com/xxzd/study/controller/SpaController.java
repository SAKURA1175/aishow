package com.xxzd.study.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    // 匹配 /app/ 下所有不带后缀名的路径，转发到 /app/index.html 交给前端路由处理
    @RequestMapping(value = { "/app", "/app/", "/app/{path:[^\\.]*}", "/app/**/{path:[^\\.]*}" })
    public String forwardToSpa() {
        return "forward:/app/index.html";
    }
}
