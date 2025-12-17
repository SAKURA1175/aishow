-- 数据库：study_ai
-- 说明：请先在 MySQL 中执行
--   CREATE DATABASE study_ai DEFAULT CHARACTER SET utf8mb4;
-- 然后在 study_ai 数据库下执行本脚本

-- 用户表：user
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `username` VARCHAR(64) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(128) NOT NULL COMMENT '登录密码（示例项目可明文，生产环境请加密）',
  `role` VARCHAR(32) NOT NULL COMMENT '角色标识：student / teacher / admin',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 文档表：document
CREATE TABLE IF NOT EXISTS `document` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(255) NOT NULL COMMENT '文档名称',
  `stored_filename` VARCHAR(512) DEFAULT NULL COMMENT '存储的文件名',
  `uploader_id` BIGINT NOT NULL COMMENT '上传人用户ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教学文档表';

-- 文档切片表：document_chunk
CREATE TABLE IF NOT EXISTS `document_chunk` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `document_id` BIGINT NOT NULL COMMENT '所属文档ID',
  `content` TEXT NOT NULL COMMENT '文本内容片段',
  `chunk_index` INT NOT NULL COMMENT '片段顺序索引',
  CONSTRAINT `fk_chunk_document` FOREIGN KEY (`document_id`) REFERENCES `document` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文档文本切片表';

-- 文档向量表：document_embedding
CREATE TABLE IF NOT EXISTS `document_embedding` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `chunk_id` BIGINT NOT NULL COMMENT '关联的文档切片ID',
  `vector` BLOB NOT NULL COMMENT '向量数据（可存为二进制或JSON）',
  CONSTRAINT `fk_embedding_chunk` FOREIGN KEY (`chunk_id`) REFERENCES `document_chunk` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文档向量表';

-- 对话会话表：chat_session
CREATE TABLE IF NOT EXISTS `chat_session` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `title` VARCHAR(255) NOT NULL COMMENT '会话标题',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话会话表';

-- 对话消息表：chat_message
CREATE TABLE IF NOT EXISTS `chat_message` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
  `session_id` BIGINT NOT NULL COMMENT '所属会话ID',
  `role` VARCHAR(32) NOT NULL COMMENT '角色：user / ai',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
  CONSTRAINT `fk_message_session` FOREIGN KEY (`session_id`) REFERENCES `chat_session` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话消息表';

-- 公告表：notice
CREATE TABLE IF NOT EXISTS `notice` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '公告ID',
  `title` VARCHAR(255) NOT NULL COMMENT '公告标题',
  `content` TEXT NOT NULL COMMENT '公告内容',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告表';

-- 用户公告关联表：user_notice
CREATE TABLE IF NOT EXISTS `user_notice` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `notice_id` BIGINT NOT NULL COMMENT '公告ID',
  `read_flag` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读：0-未读，1-已读',
  PRIMARY KEY (`user_id`, `notice_id`),
  CONSTRAINT `fk_user_notice_notice` FOREIGN KEY (`notice_id`) REFERENCES `notice` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户公告关联表';

-- 用户提问日志表：user_question_log
CREATE TABLE IF NOT EXISTS `user_question_log` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `question` TEXT NOT NULL COMMENT '问题内容',
  `topic` VARCHAR(128) DEFAULT NULL COMMENT '知识主题',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户提问日志表';

-- 学习画像表：learning_profile
CREATE TABLE IF NOT EXISTS `learning_profile` (
  `user_id` BIGINT PRIMARY KEY COMMENT '用户ID',
  `weak_topics` TEXT COMMENT '薄弱知识点集合（JSON 字符串）',
  `strong_topics` TEXT COMMENT '优势知识点集合（JSON 字符串）',
  `suggestion` TEXT COMMENT '学习建议'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习画像表';

-- AI 评价表：ai_feedback
CREATE TABLE IF NOT EXISTS `ai_feedback` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `score` INT NOT NULL COMMENT '评分 1-5',
  `comment` TEXT COMMENT '评价内容'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 评价表';

-- Prompt 模板表：prompt_template
CREATE TABLE IF NOT EXISTS `prompt_template` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `role` VARCHAR(32) NOT NULL COMMENT '角色标识：student / teacher / system 等',
  `content` TEXT NOT NULL COMMENT 'Prompt 内容',
  `version` VARCHAR(32) NOT NULL COMMENT '版本号'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Prompt 模板表';
