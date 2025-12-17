-- 数据库迁移脚本
-- 为 document 表添加 stored_filename 列

ALTER TABLE document ADD COLUMN `stored_filename` VARCHAR(512) COMMENT '存储的文件名' AFTER `name`;
