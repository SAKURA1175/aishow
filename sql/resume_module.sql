-- 简历优化模块建表脚本
-- 执行方式：登录 MySQL 后 source 此文件，或在 docker-compose 初始化脚本中引用

-- 简历记录表
CREATE TABLE IF NOT EXISTS `resume` (
  `id`               bigint NOT NULL AUTO_INCREMENT,
  `user_id`          bigint NOT NULL,
  `filename`         varchar(255) NOT NULL,
  `file_type`        varchar(16)  NOT NULL COMMENT 'pdf/docx/txt',
  `raw_text`         longtext     COMMENT '原始提取文本',
  `structured_json`  longtext     COMMENT 'AI 结构化解析结果 (JSON)',
  `analysis_json`    longtext     COMMENT 'AI 分析报告 (JSON)',
  `score`            int          DEFAULT NULL COMMENT '简历综合评分 0-100',
  `create_time`      datetime     DEFAULT CURRENT_TIMESTAMP,
  `update_time`      datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='简历记录表';

-- 引导式学习进度表
CREATE TABLE IF NOT EXISTS `learning_flow_progress` (
  `id`           bigint NOT NULL AUTO_INCREMENT,
  `user_id`      bigint NOT NULL,
  `flow_type`    varchar(32) NOT NULL COMMENT '流程类型: resume_basics',
  `current_step` int NOT NULL DEFAULT 0,
  `total_steps`  int NOT NULL,
  `step_data`    longtext     COMMENT '各步骤状态和用户输入 (JSON)',
  `status`       varchar(16) NOT NULL DEFAULT 'in_progress' COMMENT 'in_progress/completed',
  `create_time`  datetime    DEFAULT CURRENT_TIMESTAMP,
  `update_time`  datetime    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_flow` (`user_id`, `flow_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='引导式学习进度表';
