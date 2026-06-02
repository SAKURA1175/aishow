-- ============================================================
-- Study AI 扩展 - 第二批 + 第三批
-- 错题本、笔记、讨论区、打卡成就、考试
-- ============================================================
USE `study_ai`;

-- 1. 错题本
CREATE TABLE IF NOT EXISTS `wrong_question` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT,
    `user_id`         BIGINT       NOT NULL,
    `subject`         VARCHAR(50),
    `content`         TEXT         NOT NULL COMMENT '题目内容',
    `correct_answer`  TEXT         COMMENT '正确答案',
    `my_answer`       TEXT         COMMENT '我的答案',
    `ai_analysis`     LONGTEXT     COMMENT 'AI错因分析',
    `knowledge_point` VARCHAR(100) COMMENT '知识点',
    `mastery`         VARCHAR(16)  NOT NULL DEFAULT 'unmastered' COMMENT 'unmastered/reviewing/mastered',
    `source`          VARCHAR(32)  DEFAULT 'manual' COMMENT 'manual/assignment',
    `source_id`       BIGINT,
    `create_time`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_subject` (`user_id`, `subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错题本';

-- 2. 课程笔记
CREATE TABLE IF NOT EXISTS `notebook` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `user_id`     BIGINT       NOT NULL,
    `course_id`   BIGINT,
    `title`       VARCHAR(200) NOT NULL,
    `content`     LONGTEXT     COMMENT 'Markdown内容',
    `ai_summary`  LONGTEXT     COMMENT 'AI摘要',
    `tags`        VARCHAR(200),
    `is_shared`   BOOLEAN      NOT NULL DEFAULT FALSE,
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程笔记';

-- 3. 讨论区
CREATE TABLE IF NOT EXISTS `post` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `user_id`     BIGINT       NOT NULL,
    `course_id`   BIGINT,
    `title`       VARCHAR(200) NOT NULL,
    `content`     LONGTEXT     NOT NULL,
    `tags`        VARCHAR(200),
    `is_pinned`   BOOLEAN      NOT NULL DEFAULT FALSE,
    `is_featured` BOOLEAN      NOT NULL DEFAULT FALSE,
    `view_count`  INT          NOT NULL DEFAULT 0,
    `reply_count` INT          NOT NULL DEFAULT 0,
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='讨论帖';

CREATE TABLE IF NOT EXISTS `post_reply` (
    `id`              BIGINT   NOT NULL AUTO_INCREMENT,
    `post_id`         BIGINT   NOT NULL,
    `user_id`         BIGINT   NOT NULL,
    `parent_reply_id` BIGINT,
    `content`         TEXT     NOT NULL,
    `is_ai_generated` BOOLEAN  NOT NULL DEFAULT FALSE,
    `create_time`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子回复';

-- 4. 打卡 & 成就
CREATE TABLE IF NOT EXISTS `checkin` (
    `id`            BIGINT   NOT NULL AUTO_INCREMENT,
    `user_id`       BIGINT   NOT NULL,
    `checkin_date`  DATE     NOT NULL,
    `study_minutes` INT      NOT NULL DEFAULT 0,
    `content`       VARCHAR(500),
    `create_time`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_date` (`user_id`, `checkin_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习打卡';

CREATE TABLE IF NOT EXISTS `achievement` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT,
    `name`           VARCHAR(100) NOT NULL,
    `description`    VARCHAR(500),
    `icon`           VARCHAR(50),
    `condition_json` TEXT         COMMENT '达成条件JSON',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就定义';

CREATE TABLE IF NOT EXISTS `user_achievement` (
    `id`             BIGINT   NOT NULL AUTO_INCREMENT,
    `user_id`        BIGINT   NOT NULL,
    `achievement_id` BIGINT   NOT NULL,
    `unlocked_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_ach` (`user_id`, `achievement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户成就';

CREATE TABLE IF NOT EXISTS `points_log` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `user_id`     BIGINT      NOT NULL,
    `action`      VARCHAR(50) NOT NULL COMMENT 'checkin/post/reply/assignment',
    `points`      INT         NOT NULL,
    `description` VARCHAR(200),
    `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分日志';

-- 5. 考试系统
CREATE TABLE IF NOT EXISTS `exam` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `title`       VARCHAR(200) NOT NULL,
    `course_id`   BIGINT,
    `teacher_id`  BIGINT       NOT NULL,
    `class_id`    BIGINT,
    `duration`    INT          NOT NULL DEFAULT 60 COMMENT '时长(分钟)',
    `total_score` INT          NOT NULL DEFAULT 100,
    `status`      VARCHAR(16)  NOT NULL DEFAULT 'draft' COMMENT 'draft/published/closed',
    `start_time`  DATETIME,
    `end_time`    DATETIME,
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试';

CREATE TABLE IF NOT EXISTS `exam_question` (
    `id`         BIGINT      NOT NULL AUTO_INCREMENT,
    `exam_id`    BIGINT      NOT NULL,
    `type`       VARCHAR(20) NOT NULL COMMENT 'choice/multi_choice/fill/short_answer',
    `content`    TEXT        NOT NULL,
    `options`    TEXT        COMMENT 'JSON选项(选择题)',
    `answer`     TEXT        NOT NULL COMMENT '标准答案',
    `score`      INT         NOT NULL DEFAULT 10,
    `sort_order` INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_exam` (`exam_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试题目';

CREATE TABLE IF NOT EXISTS `exam_submission` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `exam_id`     BIGINT      NOT NULL,
    `student_id`  BIGINT      NOT NULL,
    `answers`     LONGTEXT    COMMENT 'JSON答案',
    `score`       INT,
    `ai_feedback` LONGTEXT,
    `status`      VARCHAR(16) NOT NULL DEFAULT 'in_progress' COMMENT 'in_progress/submitted/graded',
    `start_time`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `submit_time` DATETIME,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_exam_student` (`exam_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试提交';

-- 预置成就
INSERT IGNORE INTO `achievement` (`id`, `name`, `description`, `icon`) VALUES
(1, '初来乍到', '完成第一次登录', '🎉'),
(2, '勤奋打卡', '连续打卡7天', '🔥'),
(3, '学霸之路', '累计打卡30天', '📚'),
(4, '好学生', '获得第一个满分', '💯'),
(5, '热心肠', '在讨论区发布第一个回复', '💬'),
(6, '知识达人', '提交10次作业', '✍️'),
(7, '学无止境', '累计学习1000分钟', '⏰'),
(8, '满腹经纶', '上传5篇课程笔记', '📝');
