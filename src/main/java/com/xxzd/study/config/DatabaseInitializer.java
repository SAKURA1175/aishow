package com.xxzd.study.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
@Lazy(false)
public class DatabaseInitializer {

    private final DataSource dataSource;

    public DatabaseInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void init() {
        try {
            Connection conn = dataSource.getConnection();
            DatabaseMetaData metaData = conn.getMetaData();
            
            // 检查 document 表是否存在 stored_filename 列
            if (!columnExists(metaData, "document", "stored_filename")) {
                System.out.println("正在添加 stored_filename 列到 document 表...");
                addStoredFilenameColumn(conn);
                System.out.println("✓ 成功添加 stored_filename 列");
            }

            if (tableExists(metaData, "user_question_log")
                    && !columnExists(metaData, "user_question_log", "session_id")) {
                System.out.println("正在添加 session_id 列到 user_question_log 表...");
                addUserQuestionLogSessionIdColumn(conn);
                System.out.println("✓ 成功添加 session_id 列");
            }
            
            conn.close();
        } catch (Exception e) {
            System.err.println("数据库初始化失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private boolean columnExists(DatabaseMetaData metaData, String tableName, String columnName) throws Exception {
        ResultSet rs = metaData.getColumns(null, null, tableName, columnName);
        boolean exists = rs.next();
        rs.close();
        return exists;
    }

    private boolean tableExists(DatabaseMetaData metaData, String tableName) throws Exception {
        ResultSet rs = metaData.getTables(null, null, tableName, null);
        boolean exists = rs.next();
        rs.close();
        return exists;
    }

    private void addStoredFilenameColumn(Connection conn) throws Exception {
        String sql = "ALTER TABLE document ADD COLUMN `stored_filename` VARCHAR(512) COMMENT '存储的文件名' AFTER `name`";
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        }
    }

    private void addUserQuestionLogSessionIdColumn(Connection conn) throws Exception {
        String sql = "ALTER TABLE user_question_log ADD COLUMN `session_id` BIGINT COMMENT '关联 AI 对话会话' AFTER `topic`";
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        }
    }
}
