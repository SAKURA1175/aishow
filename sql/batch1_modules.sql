-- ============================================================
-- Study AI 扩展模块 - 第一批
-- 包含：班级管理、作业系统、成绩管理、待办日程
-- 执行：docker exec -i aishow-mysql mysql -uroot -p1234 study_ai < sql/batch1_modules.sql
-- ============================================================

USE `study_ai`;

-- ============================================================
-- 1. 班级管理
-- ============================================================
CREATE TABLE IF NOT EXISTS `class` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`        VARCHAR(100) NOT NULL                COMMENT '班级名称',
    `description` VARCHAR(500)                         COMMENT '班级描述',
    `teacher_id`  BIGINT       NOT NULL                COMMENT '创建教师 ID',
    `invite_code` VARCHAR(8)   NOT NULL UNIQUE         COMMENT '邀请码（6-8位）',
    `semester`    VARCHAR(20)                          COMMENT '学期（如 2025-春）',
    `status`      VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT '状态：active/archived',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_teacher` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级表';

CREATE TABLE IF NOT EXISTS `class_member` (
    `id`        BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    `class_id`  BIGINT      NOT NULL                COMMENT '班级 ID',
    `user_id`   BIGINT      NOT NULL                COMMENT '用户 ID',
    `role`      VARCHAR(16) NOT NULL DEFAULT 'student' COMMENT '班级角色：student/monitor/teacher',
    `join_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_class_user` (`class_id`, `user_id`),
    KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级成员表';

-- ============================================================
-- 2. 作业系统
-- ============================================================
CREATE TABLE IF NOT EXISTS `assignment` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `title`       VARCHAR(200) NOT NULL                COMMENT '作业标题',
    `description` LONGTEXT                             COMMENT '作业描述（Markdown）',
    `teacher_id`  BIGINT       NOT NULL                COMMENT '发布教师 ID',
    `class_id`    BIGINT                               COMMENT '所属班级（NULL=全部）',
    `due_date`    DATETIME                             COMMENT '截止时间',
    `max_score`   INT          NOT NULL DEFAULT 100    COMMENT '满分',
    `rubric`      LONGTEXT                             COMMENT '评分标准 JSON',
    `attachments` LONGTEXT                             COMMENT '附件列表 JSON',
    `status`      VARCHAR(16)  NOT NULL DEFAULT 'published' COMMENT '状态：draft/published/closed',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_teacher` (`teacher_id`),
    KEY `idx_class` (`class_id`),
    KEY `idx_due` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业表';

CREATE TABLE IF NOT EXISTS `assignment_submission` (
    `id`               BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    `assignment_id`    BIGINT      NOT NULL                COMMENT '作业 ID',
    `student_id`       BIGINT      NOT NULL                COMMENT '学生 ID',
    `content`          LONGTEXT                            COMMENT '提交内容（文本/Markdown）',
    `file_url`         VARCHAR(500)                        COMMENT '附件 URL',
    `ai_score`         INT                                 COMMENT 'AI 评分',
    `ai_feedback`      LONGTEXT                            COMMENT 'AI 评语',
    `teacher_score`    INT                                 COMMENT '教师评分（最终）',
    `teacher_feedback` LONGTEXT                            COMMENT '教师评语',
    `status`           VARCHAR(16) NOT NULL DEFAULT 'submitted' COMMENT '状态：draft/submitted/graded',
    `submit_time`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `grade_time`       DATETIME                            COMMENT '批改时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_assign_student` (`assignment_id`, `student_id`),
    KEY `idx_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业提交表';

-- ============================================================
-- 3. 成绩管理
-- ============================================================
CREATE TABLE IF NOT EXISTS `course` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`        VARCHAR(100) NOT NULL                COMMENT '课程名称',
    `credit`      DECIMAL(3,1) NOT NULL DEFAULT 0      COMMENT '学分',
    `semester`    VARCHAR(20)                          COMMENT '学期',
    `teacher_id`  BIGINT                               COMMENT '授课教师',
    `class_id`    BIGINT                               COMMENT '班级',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_teacher` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

CREATE TABLE IF NOT EXISTS `grade` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT       NOT NULL                COMMENT '学生 ID',
    `course_id`   BIGINT       NOT NULL                COMMENT '课程 ID',
    `score`       DECIMAL(5,1)                         COMMENT '分数',
    `grade_point` DECIMAL(3,1)                         COMMENT '绩点',
    `grade_type`  VARCHAR(16)  NOT NULL DEFAULT 'final' COMMENT '类型：midterm/final/quiz/assignment',
    `semester`    VARCHAR(20)                          COMMENT '学期',
    `remark`      VARCHAR(200)                         COMMENT '备注',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_course` (`user_id`, `course_id`),
    KEY `idx_semester` (`semester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成绩表';

-- ============================================================
-- 4. 待办 & 日程管理
-- ============================================================
CREATE TABLE IF NOT EXISTS `todo` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT       NOT NULL                COMMENT '用户 ID',
    `title`       VARCHAR(200) NOT NULL                COMMENT '待办标题',
    `description` TEXT                                 COMMENT '详细描述',
    `priority`    TINYINT      NOT NULL DEFAULT 2      COMMENT '优先级：1=高 2=中 3=低',
    `due_date`    DATETIME                             COMMENT '截止日期',
    `tags`        VARCHAR(200)                         COMMENT '标签（逗号分隔）',
    `status`      VARCHAR(16)  NOT NULL DEFAULT 'pending' COMMENT '状态：pending/done/cancelled',
    `source_type` VARCHAR(32)                          COMMENT '来源类型：manual/assignment/system',
    `source_id`   BIGINT                               COMMENT '来源 ID（如作业 ID）',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_status` (`user_id`, `status`),
    KEY `idx_due` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待办事项表';

CREATE TABLE IF NOT EXISTS `schedule_event` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT       NOT NULL                COMMENT '用户 ID',
    `title`       VARCHAR(200) NOT NULL                COMMENT '事件标题',
    `description` TEXT                                 COMMENT '事件描述',
    `event_type`  VARCHAR(32)  NOT NULL DEFAULT 'custom' COMMENT '类型：class/exam/assignment_due/custom',
    `start_time`  DATETIME     NOT NULL                COMMENT '开始时间',
    `end_time`    DATETIME                             COMMENT '结束时间',
    `all_day`     BOOLEAN      NOT NULL DEFAULT FALSE  COMMENT '是否全天事件',
    `recurrence`  VARCHAR(100)                         COMMENT '重复规则（RRULE 格式）',
    `color`       VARCHAR(7)                           COMMENT '颜色标记（#hex）',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_time` (`user_id`, `start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='日程事件表';
