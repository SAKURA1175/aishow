package com.xxzd.study.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.xxzd.study.mapper")
public class MyBatisConfig {
}

