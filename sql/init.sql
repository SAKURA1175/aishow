-- ============================================================
-- Study AI 数据库初始化脚本
-- 数据库：study_ai
-- 字符集：utf8mb4
-- 执行方式：mysql -uroot -p study_ai < sql/init.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `study_ai`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `study_ai`;

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS `user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `username`    VARCHAR(50)  NOT NULL                COMMENT '用户名（唯一）',
    `password`    VARCHAR(255) NOT NULL                COMMENT '密码（BCrypt）',
    `role`        VARCHAR(20)  NOT NULL DEFAULT 'student' COMMENT '角色：student/teacher/admin',
    `avatar`      VARCHAR(500)                         COMMENT '头像 URL',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 默认管理员账号（密码：admin123，BCrypt 加密）
INSERT IGNORE INTO `user` (`username`, `password`, `role`)
VALUES
    ('admin',       '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6aFIS', 'admin'),
    ('testteacher', '$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bh7wPBU3UVYnEfOG5Yp2', 'teacher'),
    ('teststudent', '$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bh7wPBU3UVYnEfOG5Yp2', 'student');
-- 默认密码：testteacher/teststudent 的密码均为 123456
-- admin 的密码为 admin123

-- ============================================================
-- 对话会话表
-- ============================================================
CREATE TABLE IF NOT EXISTS `chat_session` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT       NOT NULL                COMMENT '所属用户',
    `title`       VARCHAR(200)                         COMMENT '会话标题',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话会话表';

-- ============================================================
-- 对话消息表
-- ============================================================
CREATE TABLE IF NOT EXISTS `chat_message` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `session_id`  BIGINT       NOT NULL                COMMENT '所属会话',
    `role`        VARCHAR(20)  NOT NULL                COMMENT '角色：user/assistant/system',
    `content`     LONGTEXT     NOT NULL                COMMENT '消息内容',
    `token_count` INT                                  COMMENT 'Token 数量',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_message_session` (`session_id`),
    CONSTRAINT `fk_message_session` FOREIGN KEY (`session_id`)
        REFERENCES `chat_session` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话消息表';

-- ============================================================
-- 文档表
-- ============================================================
CREATE TABLE IF NOT EXISTS `document` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `filename`        VARCHAR(255) NOT NULL                COMMENT '原始文件名',
    `file_type`       VARCHAR(20)                          COMMENT '文件类型：pdf/docx/doc/txt/md',
    `uploader_id`     BIGINT       NOT NULL                COMMENT '上传者 ID',
    `stored_filename` VARCHAR(300)                         COMMENT '磁盘存储文件名',
    `char_count`      INT                                  COMMENT '文本总字符数',
    `chunk_count`     INT                                  COMMENT '切片数量',
    `status`          VARCHAR(20)  NOT NULL DEFAULT 'ready' COMMENT '状态：processing/ready/error',
    `create_time`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_uploader` (`uploader_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教学文档表';

-- ============================================================
-- 文档切片表
-- ============================================================
CREATE TABLE IF NOT EXISTS `document_chunk` (
    `id`          BIGINT    NOT NULL AUTO_INCREMENT COMMENT '主键',
    `document_id` BIGINT    NOT NULL               COMMENT '所属文档',
    `content`     TEXT      NOT NULL               COMMENT '切片文本内容',
    `chunk_index` INT       NOT NULL               COMMENT '切片序号（从0开始）',
    `char_count`  INT                              COMMENT '字符数',
    PRIMARY KEY (`id`),
    KEY `fk_chunk_document` (`document_id`),
    CONSTRAINT `fk_chunk_document` FOREIGN KEY (`document_id`)
        REFERENCES `document` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文档文本切片表';

-- ============================================================
-- 文档向量表（ChromaDB 降级备份）
-- ============================================================
CREATE TABLE IF NOT EXISTS `document_embedding` (
    `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    `chunk_id`   BIGINT      NOT NULL UNIQUE         COMMENT '关联切片 ID',
    `embedding`  MEDIUMBLOB  NOT NULL                COMMENT '序列化向量（float[]）',
    PRIMARY KEY (`id`),
    KEY `fk_embedding_chunk` (`chunk_id`),
    CONSTRAINT `fk_embedding_chunk` FOREIGN KEY (`chunk_id`)
        REFERENCES `document_chunk` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文档向量表（降级备份）';

-- ============================================================
-- 用户提问日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_question_log` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT       NOT NULL                COMMENT '用户 ID',
    `question`    TEXT         NOT NULL                COMMENT '提问内容',
    `topic`       VARCHAR(50)                          COMMENT '主题分类（TopicClassifier）',
    `session_id`  BIGINT                               COMMENT '关联会话 ID',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_topic` (`user_id`, `topic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户提问日志（学习画像数据源）';

-- ============================================================
-- 学习画像表
-- ============================================================
CREATE TABLE IF NOT EXISTS `learning_profile` (
    `id`          BIGINT    NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT    NOT NULL UNIQUE         COMMENT '用户 ID（唯一）',
    `topic_data`  LONGTEXT                          COMMENT '各主题掌握程度 JSON',
    `update_time` DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户学习画像表';

-- ============================================================
-- AI 反馈表（评分/点赞）
-- ============================================================
CREATE TABLE IF NOT EXISTS `ai_feedback` (
    `id`          BIGINT    NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT    NOT NULL               COMMENT '用户 ID',
    `message_id`  BIGINT    NOT NULL               COMMENT '消息 ID',
    `rating`      TINYINT   NOT NULL               COMMENT '评分：1=👍 -1=👎',
    `comment`     TEXT                             COMMENT '文字反馈',
    `create_time` DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_message` (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI评价表';
