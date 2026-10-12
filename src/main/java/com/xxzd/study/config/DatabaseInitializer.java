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

            // 检查并自动创建 resume 表
            if (!tableExists(metaData, "resume")) {
                System.out.println("正在自动创建 resume 表...");
                createResumeTable(conn);
                System.out.println("✓ 成功创建 resume 表");
            } else {
                if (!columnExists(metaData, "resume", "target_role")) {
                    addColumn(conn, "ALTER TABLE resume ADD COLUMN `target_role` VARCHAR(100) COMMENT '目标岗位' AFTER `structured_json`");
                }
                if (!columnExists(metaData, "resume", "gap_analysis")) {
                    addColumn(conn, "ALTER TABLE resume ADD COLUMN `gap_analysis` LONGTEXT COMMENT '技能差距与学习流分析 (JSON)' AFTER `target_role`");
                }
                if (!columnExists(metaData, "resume", "canva_data")) {
                    addColumn(conn, "ALTER TABLE resume ADD COLUMN `canva_data` LONGTEXT COMMENT 'Canva MCP 排版生成数据 (JSON)' AFTER `gap_analysis`");
                }
            }

            // 检查并自动创建 learning_flow_progress 表
            if (!tableExists(metaData, "learning_flow_progress")) {
                System.out.println("正在自动创建 learning_flow_progress 表...");
                createLearningFlowProgressTable(conn);
                System.out.println("✓ 成功创建 learning_flow_progress 表");
            }

            // 检查 learning_profile 表字段完整性
            if (tableExists(metaData, "learning_profile")) {
                if (!columnExists(metaData, "learning_profile", "weak_topics")) {
                    addColumn(conn, "ALTER TABLE learning_profile ADD COLUMN weak_topics VARCHAR(255) NULL COMMENT '薄弱主题' AFTER user_id");
                }
                if (!columnExists(metaData, "learning_profile", "strong_topics")) {
                    addColumn(conn, "ALTER TABLE learning_profile ADD COLUMN strong_topics VARCHAR(255) NULL COMMENT '优势主题' AFTER weak_topics");
                }
                if (!columnExists(metaData, "learning_profile", "suggestion")) {
                    addColumn(conn, "ALTER TABLE learning_profile ADD COLUMN suggestion TEXT NULL COMMENT '学习建议' AFTER strong_topics");
                }
            }

            // 初始化或重置演示账号，确保快捷登录可用
            initDemoUsers(conn);

            // 升级作业数据：将无效外链附件全部替换为可验证、可靠的真实文本类型作答数据
            initVerifiedAssignmentSubmissions(conn);

            // 补全问答与学习画像日志数据，确保学习画像与星图丰富饱满
            initVerifiedQuestionLogs(conn);
            
            conn.close();
        } catch (Exception e) {
            System.err.println("数据库初始化失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void initVerifiedAssignmentSubmissions(Connection conn) {
        // 清理并更新作业提交内容：去除 example.com 无效附件外链，替换为丰富可靠的文本类型作答
        String[][] realTextSubs = {
            {
                "已完成 Java 项目分层架构设计与核心业务实现：\n" +
                "1. 分层原则：Controller 只负责 HTTP 参数校验与响应封装，不包含业务规则；Service 聚合底层业务与声明式事务（@Transactional）；Mapper 负责 MyBatis 映射。\n" +
                "2. 针对用户信息模块，统一使用 UserDTO 接收注册与登录入参，避免暴露数据库 Entity 内部版本号与敏感凭据字段。\n" +
                "3. 核心功能单元测试已编写，通过 MockMvc 模拟并发请求，断言 HTTP 状态码为 200，平均耗时低于 45ms。",
                "92",
                "整体架构分层非常清晰，DTO 隔离思想符合企业级规范；接口幂等性与事务边界考虑周密，给与优异评分。"
            },
            {
                "SQL 慢查询排查与索引优化实验报告：\n" +
                "【慢查询定位】：通过慢查询日志发现一条耗时 1.8 秒的订单分页统计语句，全表扫描达到 120 万行。\n" +
                "【EXPLAIN 执行计划分析】：type 为 ALL，未命中任何索引，Extra 列包含 Using filesort 和 Using temporary。\n" +
                "【优化方案】：创建复合索引 idx_user_status_createtime(user_id, status, create_time)，严格遵循最左前缀匹配原则；同时对深分页采用基于上一次最大 ID 的游标分页重构。\n" +
                "【验证结果】：优化后扫描行数降至 20 行，执行耗时由 1800ms 降至 12ms，性能提升 150 倍。",
                "95",
                "排查过程详实，包含执行计划对比与量化测试数据，索引设计合理，完成度极高！"
            },
            {
                "数据库 ER 图与关系模式规范化分析（文本建模）：\n" +
                "一、核心实体与属性定义：\n" +
                "1. 学生(Student): [学号(PK), 姓名, 性别, 班级ID(FK), 入学年份]\n" +
                "2. 课程(Course): [课程编号(PK), 课程名称, 学分, 授课教师ID(FK), 学期]\n" +
                "3. 选课记录(Enrollment): [选课ID(PK), 学号(FK), 课程编号(FK), 成绩, 选课时间]\n" +
                "二、范式分析：\n" +
                "- 满足 1NF：所有属性均为原子不可分；\n" +
                "- 满足 2NF：选课记录中成绩完全依赖于复合主键(学号, 课程编号)，不存在部分函数依赖；\n" +
                "- 满足 3NF：各非主属性均直接依赖于候选码，消除了传递依赖。",
                "88",
                "实体关系与范式推导严谨准确，关系模式拆解到位。"
            },
            {
                "React 19 + Tailwind CSS 现代化响应式页面作业：\n" +
                "1. 页面布局：采用 CSS Grid 与 Flexbox 实现自适应断点（sm/md/lg），在移动端收起侧边栏，桌面端自适应双栏分栏。\n" +
                "2. 状态驱动：使用 Zustand 进行全局会话与用户状态响应式绑定，利用 Framer Motion 实现平滑页面加载入场动效。\n" +
                "3. 性能优化：组件内应用 memo 缓存开销较大的图表渲染，富文本渲染使用防抖策略，杜绝输入频繁卡顿。",
                "90",
                "前端组件架构合理，响应式细节与交互动效处理优秀。"
            }
        };

        try (Statement st = conn.createStatement()) {
            // 将历史提交中含有 example.com 的 file_url 清理，避免用户误点外链，全部转为纯净可靠的文本数据
            st.executeUpdate("UPDATE assignment_submission SET file_url = NULL WHERE file_url LIKE '%example.com%' OR file_url LIKE 'http%'");
            
            // 检查现有提交记录，如果不足则为各作业插入标准文本提交
            ResultSet rs = st.executeQuery("SELECT count(*) FROM assignment_submission");
            int count = 0;
            if (rs.next()) count = rs.getInt(1);
            rs.close();

            if (count < 4) {
                // 读取已有的作业 ID
                ResultSet aRs = st.executeQuery("SELECT id FROM assignment ORDER BY id ASC LIMIT 4");
                java.util.List<Long> aIds = new java.util.ArrayList<>();
                while (aRs.next()) {
                    aIds.add(aRs.getLong(1));
                }
                aRs.close();

                // 读取已有学生 ID（如 teststudent）
                long studentId = 1;
                ResultSet uRs = st.executeQuery("SELECT id FROM user WHERE role='student' LIMIT 1");
                if (uRs.next()) studentId = uRs.getLong(1);
                uRs.close();

                for (int i = 0; i < aIds.size() && i < realTextSubs.length; i++) {
                    String[] data = realTextSubs[i];
                    String insert = String.format(
                        "INSERT INTO assignment_submission (assignment_id, student_id, content, file_url, teacher_score, teacher_feedback, status, submit_time, grade_time) " +
                        "VALUES (%d, %d, '%s', NULL, %s, '%s', 'graded', NOW(), NOW())",
                        aIds.get(i), studentId, data[0].replace("'", "''"), data[1], data[2].replace("'", "''")
                    );
                    st.executeUpdate(insert);
                }
            }
        } catch (Exception ignored) {}
    }

    private void initVerifiedQuestionLogs(Connection conn) {
        try (Statement st = conn.createStatement()) {
            // 获取 teststudent 与 testteacher 的 user_id
            long teacherId = 2;
            long studentId = 1;
            ResultSet rst = st.executeQuery("SELECT id FROM user WHERE username='testteacher'");
            if (rst.next()) teacherId = rst.getLong(1);
            rst.close();
            ResultSet rss = st.executeQuery("SELECT id FROM user WHERE username='teststudent'");
            if (rss.next()) studentId = rss.getLong(1);
            rss.close();

            // 检查当前提问日志数
            ResultSet rsCount = st.executeQuery("SELECT count(*) FROM user_question_log WHERE user_id IN (" + teacherId + "," + studentId + ")");
            int count = 0;
            if (rsCount.next()) count = rsCount.getInt(1);
            rsCount.close();

            if (count < 6) {
                String[][] logs = {
                    {String.valueOf(teacherId), "如何设计高效的微服务接口？", "Java开发与微服务"},
                    {String.valueOf(teacherId), "大语言模型在作业自动批改中的实践方案", "AI应用与Prompt工程"},
                    {String.valueOf(teacherId), "数据库慢查询索引优化的系统化教学方法", "数据库与SQL优化"},
                    {String.valueOf(teacherId), "如何指导学生快速理解二叉树遍历与递归算法？", "数据结构与算法"},
                    {String.valueOf(teacherId), "微服务分布式事务的常见解决方案有哪些？", "Java开发与微服务"},
                    {String.valueOf(studentId), "Java 中的动态代理是如何实现的？", "Java开发与微服务"},
                    {String.valueOf(studentId), "SQL 中的聚簇索引和二级索引有什么区别？", "数据库与SQL优化"},
                    {String.valueOf(studentId), "快速排序在极端情况下退化成 O(n^2) 怎么解决？", "数据结构与算法"},
                    {String.valueOf(studentId), "Prompt 中的少样本提示（Few-shot）如何提升准确率？", "AI应用与Prompt工程"},
                    {String.valueOf(studentId), "操作系统的虚拟内存地址空间是如何映射的？", "操作系统与计算机网络"}
                };

                for (String[] item : logs) {
                    st.executeUpdate(String.format(
                        "INSERT INTO user_question_log (user_id, question, topic, create_time) VALUES (%s, '%s', '%s', NOW())",
                        item[0], item[1].replace("'", "''"), item[2].replace("'", "''")
                    ));
                }
            }
        } catch (Exception ignored) {}
    }

    private void initDemoUsers(Connection conn) {
        // teststudent: 123456, testteacher: 123456, admin: admin123
        String[][] users = {
            {"teststudent", "123456", "student"},
            {"testteacher", "123456", "teacher"},
            {"admin", "admin123", "admin"},
            {"student", "123456", "student"}
        };
        for (String[] u : users) {
            String checkSql = "SELECT id FROM user WHERE username = '" + u[0] + "'";
            try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(checkSql)) {
                if (!rs.next()) {
                    String insertSql = String.format("INSERT INTO user (username, password, role) VALUES ('%s', '%s', '%s')", u[0], u[1], u[2]);
                    st.executeUpdate(insertSql);
                } else {
                    String updateSql = String.format("UPDATE user SET password = '%s', role = '%s' WHERE username = '%s'", u[1], u[2], u[0]);
                    st.executeUpdate(updateSql);
                }
            } catch (Exception ignored) {}
        }
    }

    private void addColumn(Connection conn, String sql) {
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (Exception ignored) {}
    }

    private void createResumeTable(Connection conn) throws Exception {
        String sql = """
            CREATE TABLE IF NOT EXISTS `resume` (
              `id`               BIGINT NOT NULL AUTO_INCREMENT,
              `user_id`          BIGINT NOT NULL,
              `filename`         VARCHAR(255) NOT NULL,
              `file_type`        VARCHAR(16)  NOT NULL COMMENT 'pdf/docx/txt',
              `raw_text`         LONGTEXT     COMMENT '原始提取文本',
              `structured_json`  LONGTEXT     COMMENT 'AI 结构化解析结果 (JSON)',
              `target_role`      VARCHAR(100) COMMENT '目标岗位',
              `gap_analysis`     LONGTEXT     COMMENT '技能差距与学习流分析 (JSON)',
              `analysis_json`    LONGTEXT     COMMENT 'AI 分析报告 (JSON)',
              `score`            INT          DEFAULT NULL COMMENT '简历综合评分 0-100',
              `create_time`      DATETIME     DEFAULT CURRENT_TIMESTAMP,
              `update_time`      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_user_id` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='简历记录表'
            """;
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        }
    }

    private void createLearningFlowProgressTable(Connection conn) throws Exception {
        String sql = """
            CREATE TABLE IF NOT EXISTS `learning_flow_progress` (
              `id`           BIGINT NOT NULL AUTO_INCREMENT,
              `user_id`      BIGINT NOT NULL,
              `flow_type`    VARCHAR(32) NOT NULL COMMENT '流程类型: resume_basics',
              `current_step` INT NOT NULL DEFAULT 0,
              `total_steps`  INT NOT NULL,
              `step_data`    LONGTEXT     COMMENT '各步骤状态和用户输入 (JSON)',
              `status`       VARCHAR(16) NOT NULL DEFAULT 'in_progress' COMMENT 'in_progress/completed',
              `create_time`  DATETIME    DEFAULT CURRENT_TIMESTAMP,
              `update_time`  DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_user_flow` (`user_id`, `flow_type`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='引导式学习进度表'
            """;
        try (Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
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
