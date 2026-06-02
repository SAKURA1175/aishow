USE `study_ai`;

-- 班级 8个
INSERT INTO class(name,description,teacher_id,invite_code,semester,status) VALUES
('Java高级班','面向对象与设计模式',6,'JV2025','2025春','active'),
('Python数据分析','数据处理与可视化',6,'PY2025','2025春','active'),
('Web前端开发','React/Vue实战',6,'WE2025','2025春','active'),
('数据库原理','SQL与数据库设计',6,'DB2025','2025春','active'),
('算法竞赛班','ACM训练',6,'AC2025','2025春','active'),
('机器学习入门','ML基础与实践',6,'ML2025','2025秋','active'),
('操作系统','进程/内存/文件管理',6,'OS2025','2025秋','active'),
('软件工程','敏捷开发与项目管理',6,'SE2025','2025秋','active');

INSERT INTO class_member(class_id,user_id,role) SELECT c.id,1,'student' FROM class c WHERE c.invite_code='JV2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,2,'student' FROM class c WHERE c.invite_code='JV2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,3,'student' FROM class c WHERE c.invite_code='JV2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,5,'student' FROM class c WHERE c.invite_code='JV2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,7,'student' FROM class c WHERE c.invite_code='JV2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,1,'student' FROM class c WHERE c.invite_code='PY2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,3,'student' FROM class c WHERE c.invite_code='PY2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,5,'student' FROM class c WHERE c.invite_code='PY2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,9,'student' FROM class c WHERE c.invite_code='PY2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,2,'student' FROM class c WHERE c.invite_code='WE2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,5,'student' FROM class c WHERE c.invite_code='WE2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,7,'student' FROM class c WHERE c.invite_code='WE2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,10,'student' FROM class c WHERE c.invite_code='WE2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,1,'student' FROM class c WHERE c.invite_code='DB2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,2,'student' FROM class c WHERE c.invite_code='DB2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,3,'student' FROM class c WHERE c.invite_code='DB2025';
INSERT INTO class_member(class_id,user_id,role) SELECT c.id,7,'student' FROM class c WHERE c.invite_code='DB2025';

-- 课程 8个 (credit是decimal)
INSERT INTO course(name,credit,semester,teacher_id) VALUES
('Java程序设计',4.0,'2025春',6),('Python编程',3.0,'2025春',6),
('Web开发技术',3.0,'2025春',6),('数据库系统',4.0,'2025春',6),
('数据结构',4.0,'2025春',6),('操作系统',4.0,'2025秋',6),
('计算机网络',3.0,'2025秋',6),('软件工程',3.0,'2025秋',6);

-- 成绩 (user_id, course_id, score)
INSERT INTO grade(user_id,course_id,score,grade_point,semester) VALUES
(1,(SELECT id FROM course WHERE name='Java程序设计'),92,4.0,'2025春'),
(1,(SELECT id FROM course WHERE name='Python编程'),88,3.7,'2025春'),
(1,(SELECT id FROM course WHERE name='Web开发技术'),95,4.0,'2025春'),
(1,(SELECT id FROM course WHERE name='数据库系统'),85,3.3,'2025春'),
(1,(SELECT id FROM course WHERE name='数据结构'),90,3.7,'2025春'),
(1,(SELECT id FROM course WHERE name='操作系统'),87,3.5,'2025秋'),
(1,(SELECT id FROM course WHERE name='计算机网络'),91,4.0,'2025秋'),
(1,(SELECT id FROM course WHERE name='软件工程'),89,3.7,'2025秋'),
(6,(SELECT id FROM course WHERE name='Java程序设计'),78,2.7,'2025春'),
(6,(SELECT id FROM course WHERE name='Python编程'),82,3.0,'2025春'),
(6,(SELECT id FROM course WHERE name='Web开发技术'),76,2.3,'2025春'),
(6,(SELECT id FROM course WHERE name='数据库系统'),88,3.7,'2025春'),
(6,(SELECT id FROM course WHERE name='数据结构'),85,3.3,'2025春'),
(6,(SELECT id FROM course WHERE name='操作系统'),79,2.7,'2025秋'),
(6,(SELECT id FROM course WHERE name='计算机网络'),83,3.0,'2025秋'),
(6,(SELECT id FROM course WHERE name='软件工程'),90,3.7,'2025秋');

-- 待办 (priority是tinyint: 1=low 2=medium 3=high)
INSERT INTO todo(user_id,title,description,priority,status,due_date) VALUES
(6,'批改Java作业','第三章OOP练习',3,'pending','2025-05-01'),
(6,'准备期中考试','出Java期中试卷',3,'pending','2025-05-10'),
(6,'更新课件','Python第5章',2,'pending','2025-05-05'),
(6,'回复学生邮件','关于项目选题',1,'completed','2025-04-20'),
(6,'提交教学计划','下学期教学安排',2,'pending','2025-06-01'),
(6,'组织班级活动','编程马拉松',1,'pending','2025-05-20'),
(6,'检查实验报告','数据库实验3',3,'pending','2025-04-28'),
(6,'备课操作系统','进程调度算法',2,'pending','2025-05-15'),
(1,'复习Java','期中考试准备',3,'pending','2025-05-08'),
(1,'完成Python作业','matplotlib画图',2,'pending','2025-04-30'),
(1,'整理笔记','数据结构复习',2,'completed','2025-04-22'),
(1,'预习数据库','第6章范式',1,'pending','2025-05-03'),
(1,'参加编程比赛','校内ACM选拔',3,'pending','2025-05-12'),
(1,'写实验报告','操作系统实验2',2,'pending','2025-05-06'),
(1,'背单词','英语四级',1,'pending','2025-06-10'),
(1,'锻炼身体','跑步30分钟',1,'completed','2025-04-23');

-- 日程事件
INSERT INTO schedule_event(user_id,title,description,start_time,end_time,event_type) VALUES
(6,'Java课','教室A301','2025-04-28 08:00:00','2025-04-28 09:40:00','class'),
(6,'教研会议','讨论期中安排','2025-04-29 14:00:00','2025-04-29 16:00:00','custom'),
(6,'Python课','实验室B205','2025-04-30 10:00:00','2025-04-30 11:40:00','class'),
(6,'办公时间','答疑','2025-05-01 14:00:00','2025-05-01 16:00:00','custom'),
(1,'Java课','A301','2025-04-28 08:00:00','2025-04-28 09:40:00','class'),
(1,'自习','图书馆三楼','2025-04-28 19:00:00','2025-04-28 21:00:00','custom'),
(1,'Python课','B205','2025-04-30 10:00:00','2025-04-30 11:40:00','class'),
(1,'ACM训练','线上','2025-05-01 19:00:00','2025-05-01 22:00:00','custom');

-- 错题本 10条
INSERT INTO wrong_question(user_id,subject,content,correct_answer,my_answer,knowledge_point,mastery,source) VALUES
(1,'Java','以下哪个不是Java基本数据类型？A.int B.String C.boolean D.char','B','A','数据类型','unmastered','manual'),
(1,'Java','abstract类可以被实例化吗？','不可以','可以','抽象类','reviewing','manual'),
(1,'Python','list和tuple的区别？','list可变tuple不可变','list更快','数据结构','unmastered','manual'),
(1,'数据库','第三范式的定义？','不存在非主属性对码的传递依赖','消除部分依赖','范式','unmastered','manual'),
(1,'数据结构','快速排序平均时间复杂度？','O(nlogn)','O(n²)','排序算法','reviewing','manual'),
(1,'操作系统','死锁的四个必要条件？','互斥/占有等待/不可抢占/循环等待','只写了三个','死锁','unmastered','manual'),
(1,'计算机网络','TCP三次握手过程？','SYN→SYN+ACK→ACK','SYN→ACK→SYN','TCP','mastered','manual'),
(1,'软件工程','敏捷开发核心原则？','个体互动>流程工具','只说了迭代','敏捷开发','reviewing','manual'),
(6,'Java','HashMap线程安全吗？','不安全','安全','集合','reviewing','manual'),
(6,'Python','GIL是什么？','全局解释器锁','垃圾回收','多线程','unmastered','manual');

-- 笔记 10条
INSERT INTO notebook(user_id,title,content,tags,is_shared) VALUES
(1,'Java多态笔记','## 多态\n- 编译时多态（重载）\n- 运行时多态（重写）','Java,OOP',true),
(1,'Python装饰器','## 装饰器\n返回函数的函数','Python,高级',true),
(1,'SQL优化技巧','## 索引优化\n1. 避免SELECT *\n2. 合理使用索引','数据库,SQL',true),
(1,'React Hooks总结','## useState useEffect useContext','前端,React',false),
(1,'排序算法对比','快排nlogn 归并nlogn 冒泡n²','数据结构,算法',true),
(6,'教学备忘-Java课','第5周：接口与抽象类','教学,Java',false),
(6,'Python教学大纲','掌握基础语法和数据分析','教学,Python',false),
(6,'期中复习重点','OOP三大特性 集合框架 异常处理','教学,复习',true),
(1,'Git常用命令','git add commit push pull','工具,Git',true),
(1,'设计模式-单例','饿汉式和懒汉式','Java,设计模式',true);

-- 讨论帖 10条
INSERT INTO post(user_id,title,content,tags,view_count,reply_count) VALUES
(1,'Java泛型擦除问题','为什么运行时泛型信息丢失？','Java,泛型',45,3),
(2,'Python虚拟环境选择','venv vs conda哪个好？','Python,工具',32,2),
(3,'React vs Vue怎么选','前端框架选型','前端,框架',67,3),
(5,'数据库索引何时不该用','索引反而变慢的场景？','数据库,优化',28,1),
(7,'ACM刷题心得','刷了200题的感悟','算法,竞赛',89,1),
(1,'Git merge vs rebase','团队协作用哪个？','Git,协作',41,1),
(9,'操作系统虚拟内存','LRU怎么实现？','操作系统,内存',23,1),
(6,'期中考试说明','Java期中范围和注意事项','通知,考试',120,2),
(10,'Docker入门踩坑','第一次部署的经历','Docker,运维',55,1),
(3,'Spring Boot热部署','devtools配置','Java,Spring',38,1);

INSERT INTO post_reply(post_id,user_id,content) VALUES
(1,6,'这是泛型类型擦除的设计'),(1,3,'用TypeToken保留泛型'),
(1,5,'Kotlin用reified可以避免'),(2,1,'推荐conda'),
(2,7,'poetry更现代'),(3,6,'企业项目建议React'),
(3,1,'Vue上手更快'),(3,9,'Svelte也不错'),
(5,6,'数据量小或更新频繁时索引开销大'),(7,3,'坚持就是胜利'),
(8,1,'老师期中几道大题？'),(8,6,'3编程+2设计'),
(4,2,'频繁写入的表要谨慎加索引'),
(6,5,'主干保持线性时 rebase 更清爽'),
(9,6,'可以用页表访问序列模拟淘汰过程'),
(10,1,'先确认依赖镜像和端口映射');

-- 打卡 16条
INSERT INTO checkin(user_id,checkin_date,study_minutes,content) VALUES
(1,'2025-04-15',120,'复习Java集合'),(1,'2025-04-16',90,'刷LeetCode'),
(1,'2025-04-17',60,'预习数据库'),(1,'2025-04-18',150,'做Python项目'),
(1,'2025-04-19',45,'整理笔记'),(1,'2025-04-20',80,'操作系统实验'),
(1,'2025-04-21',100,'复习网络'),(1,'2025-04-22',70,'写实验报告'),
(6,'2025-04-15',60,'备课Java'),(6,'2025-04-16',90,'批改作业'),
(6,'2025-04-17',120,'准备教案'),(6,'2025-04-18',45,'教研活动'),
(6,'2025-04-19',60,'答疑'),(6,'2025-04-20',80,'出试卷'),
(6,'2025-04-21',100,'批改报告'),(6,'2025-04-22',50,'更新课件');

INSERT INTO points_log(user_id,action,points,description) VALUES
(1,'checkin',10,'每日打卡 +10'),(1,'checkin',10,'每日打卡 +10'),
(1,'checkin',10,'每日打卡 +10'),(1,'checkin',10,'每日打卡 +10'),
(1,'checkin',10,'每日打卡 +10'),(1,'checkin',10,'每日打卡 +10'),
(1,'checkin',10,'每日打卡 +10'),(1,'checkin',10,'每日打卡 +10'),
(1,'post',5,'发布帖子 +5'),(1,'reply',3,'回复 +3'),
(6,'checkin',10,'每日打卡 +10'),(6,'checkin',10,'每日打卡 +10'),
(6,'checkin',10,'每日打卡 +10'),(6,'checkin',10,'每日打卡 +10'),
(6,'checkin',10,'每日打卡 +10'),(6,'checkin',10,'每日打卡 +10');

-- 作业 8个
INSERT INTO assignment(title,description,teacher_id,class_id,max_score,status,due_date) VALUES
('Java基础语法','课后习题1-10',6,(SELECT id FROM class WHERE invite_code='JV2025'),100,'published','2025-05-01'),
('Java OOP','设计学生管理系统',6,(SELECT id FROM class WHERE invite_code='JV2025'),100,'published','2025-05-08'),
('Python数据处理','pandas清洗数据',6,(SELECT id FROM class WHERE invite_code='PY2025'),100,'published','2025-05-05'),
('Python可视化','matplotlib画图',6,(SELECT id FROM class WHERE invite_code='PY2025'),100,'published','2025-05-12'),
('HTML/CSS布局','响应式页面',6,(SELECT id FROM class WHERE invite_code='WE2025'),100,'published','2025-05-03'),
('React组件开发','Todo应用',6,(SELECT id FROM class WHERE invite_code='WE2025'),100,'published','2025-05-10'),
('SQL查询练习','10道SQL题',6,(SELECT id FROM class WHERE invite_code='DB2025'),100,'published','2025-05-06'),
('数据库设计','电商ER图',6,(SELECT id FROM class WHERE invite_code='DB2025'),100,'draft','2025-05-15');

-- 考试 8个
INSERT INTO exam(title,teacher_id,class_id,duration,total_score,status) VALUES
('Java期中考试',6,(SELECT id FROM class WHERE invite_code='JV2025'),90,100,'published'),
('Python期中考试',6,(SELECT id FROM class WHERE invite_code='PY2025'),60,100,'published'),
('Web前端测验',6,(SELECT id FROM class WHERE invite_code='WE2025'),45,50,'published'),
('数据库期中',6,(SELECT id FROM class WHERE invite_code='DB2025'),90,100,'published'),
('算法周测1',6,(SELECT id FROM class WHERE invite_code='AC2025'),30,50,'published'),
('机器学习Quiz',6,(SELECT id FROM class WHERE invite_code='ML2025'),30,40,'draft'),
('操作系统期中',6,(SELECT id FROM class WHERE invite_code='OS2025'),90,100,'draft'),
('软件工程测验',6,(SELECT id FROM class WHERE invite_code='SE2025'),45,60,'published');

-- 考试题目(Java期中8题)
INSERT INTO exam_question(exam_id,type,content,options,answer,score,sort_order)
SELECT e.id,'choice','以下哪个是Java基本数据类型？','A. String\nB. Integer\nC. int\nD. Object','C',5,1 FROM exam e WHERE e.title='Java期中考试' UNION ALL
SELECT e.id,'choice','哪个关键字用于继承？','A. implements\nB. extends\nC. inherit\nD. super','B',5,2 FROM exam e WHERE e.title='Java期中考试' UNION ALL
SELECT e.id,'true_false','Java支持多重继承','','错',5,3 FROM exam e WHERE e.title='Java期中考试' UNION ALL
SELECT e.id,'true_false','接口方法默认public abstract','','对',5,4 FROM exam e WHERE e.title='Java期中考试' UNION ALL
SELECT e.id,'fill','用____关键字定义常量','','final',10,5 FROM exam e WHERE e.title='Java期中考试' UNION ALL
SELECT e.id,'fill','ArrayList底层是____','','数组',10,6 FROM exam e WHERE e.title='Java期中考试' UNION ALL
SELECT e.id,'short_answer','简述Java多态','','多态通过继承和接口实现，运行时动态绑定',30,7 FROM exam e WHERE e.title='Java期中考试' UNION ALL
SELECT e.id,'short_answer','HashMap vs TreeMap','','HashMap哈希表无序O(1)，TreeMap红黑树有序O(logn)',30,8 FROM exam e WHERE e.title='Java期中考试';

-- Python期中8题
INSERT INTO exam_question(exam_id,type,content,options,answer,score,sort_order)
SELECT e.id,'choice','列表推导式语法？','A. [x for x in range(10)]\nB. {x for x in range(10)}\nC. (x for x in range(10))\nD. <x for x>','A',5,1 FROM exam e WHERE e.title='Python期中考试' UNION ALL
SELECT e.id,'choice','不是内置数据类型？','A. list\nB. dict\nC. array\nD. tuple','C',5,2 FROM exam e WHERE e.title='Python期中考试' UNION ALL
SELECT e.id,'true_false','Python是强类型语言','','对',5,3 FROM exam e WHERE e.title='Python期中考试' UNION ALL
SELECT e.id,'true_false','缩进不影响执行','','错',5,4 FROM exam e WHERE e.title='Python期中考试' UNION ALL
SELECT e.id,'fill','用____创建虚拟环境','','venv',10,5 FROM exam e WHERE e.title='Python期中考试' UNION ALL
SELECT e.id,'fill','pip install -r ____','','requirements.txt',10,6 FROM exam e WHERE e.title='Python期中考试' UNION ALL
SELECT e.id,'short_answer','解释GIL','','全局解释器锁，同一时刻只允许一个线程执行字节码',30,7 FROM exam e WHERE e.title='Python期中考试' UNION ALL
SELECT e.id,'short_answer','常用Web框架','','Django Flask FastAPI',30,8 FROM exam e WHERE e.title='Python期中考试';

INSERT IGNORE INTO user_achievement(user_id,achievement_id) VALUES (1,1),(1,2),(1,5),(6,1),(6,2),(6,3);

-- ============================================================
-- 大屏/全模块演示补充数据
-- 目标：默认教师(testteacher/id=2)、默认学生(teststudent/id=3)和各功能面板都有可展示数据
-- ============================================================

-- 补齐演示用户（密码均沿用 123456 的 bcrypt）
INSERT IGNORE INTO `user` (`id`, `username`, `password`, `role`) VALUES
(4,'student_li','$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bh7wPBU3UVYnEfOG5Yp2','student'),
(5,'student_wang','$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bh7wPBU3UVYnEfOG5Yp2','student'),
(6,'teacher_liu','$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bh7wPBU3UVYnEfOG5Yp2','teacher'),
(7,'student_chen','$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bh7wPBU3UVYnEfOG5Yp2','student'),
(8,'student_zhao','$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bh7wPBU3UVYnEfOG5Yp2','student'),
(9,'student_sun','$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bh7wPBU3UVYnEfOG5Yp2','student'),
(10,'student_zhou','$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bh7wPBU3UVYnEfOG5Yp2','student');

-- 默认教师 testteacher(id=2) 的班级，便于教师端直接看到数据
INSERT IGNORE INTO class(name,description,teacher_id,invite_code,semester,status) VALUES
('演示Java实战班','面向项目制学习：集合、IO、Spring Boot',2,'TJ2025','2025春','active'),
('演示AI应用班','Prompt、RAG、智能体与课程项目',2,'TA2025','2025春','active'),
('演示数据库训练营','SQL、索引、事务与ER建模',2,'TD2025','2025春','active'),
('演示综合提高班','考试冲刺、错题复盘与学习计划',2,'TS2025','2025秋','active');

-- 让秋季班和默认教师班都有成员
INSERT IGNORE INTO class_member(class_id,user_id,role) SELECT c.id,3,'student' FROM class c WHERE c.invite_code IN ('AC2025','ML2025','OS2025','SE2025','TJ2025','TA2025','TD2025','TS2025');
INSERT IGNORE INTO class_member(class_id,user_id,role) SELECT c.id,4,'student' FROM class c WHERE c.invite_code IN ('AC2025','OS2025','TJ2025','TA2025','TD2025');
INSERT IGNORE INTO class_member(class_id,user_id,role) SELECT c.id,5,'student' FROM class c WHERE c.invite_code IN ('AC2025','ML2025','SE2025','TJ2025','TA2025','TS2025');
INSERT IGNORE INTO class_member(class_id,user_id,role) SELECT c.id,7,'student' FROM class c WHERE c.invite_code IN ('AC2025','TJ2025','TD2025','TS2025');
INSERT IGNORE INTO class_member(class_id,user_id,role) SELECT c.id,8,'student' FROM class c WHERE c.invite_code IN ('ML2025','SE2025','TA2025','TS2025');
INSERT IGNORE INTO class_member(class_id,user_id,role) SELECT c.id,9,'student' FROM class c WHERE c.invite_code IN ('ML2025','TA2025','TD2025');
INSERT IGNORE INTO class_member(class_id,user_id,role) SELECT c.id,10,'student' FROM class c WHERE c.invite_code IN ('OS2025','WE2025','TD2025','TS2025');

-- 给原课程补上班级关联，增强成绩/班级联动
UPDATE course SET class_id=(SELECT id FROM class WHERE invite_code='JV2025') WHERE name='Java程序设计';
UPDATE course SET class_id=(SELECT id FROM class WHERE invite_code='PY2025') WHERE name='Python编程';
UPDATE course SET class_id=(SELECT id FROM class WHERE invite_code='WE2025') WHERE name='Web开发技术';
UPDATE course SET class_id=(SELECT id FROM class WHERE invite_code='DB2025') WHERE name='数据库系统';
UPDATE course SET class_id=(SELECT id FROM class WHERE invite_code='AC2025') WHERE name='数据结构';
UPDATE course SET class_id=(SELECT id FROM class WHERE invite_code='OS2025') WHERE name='操作系统';
UPDATE course SET class_id=(SELECT id FROM class WHERE invite_code='SE2025') WHERE name='软件工程';

INSERT INTO course(name,credit,semester,teacher_id,class_id) VALUES
('演示Java项目实战',3.0,'2025春',2,(SELECT id FROM class WHERE invite_code='TJ2025')),
('演示Spring Boot专题',2.5,'2025春',2,(SELECT id FROM class WHERE invite_code='TJ2025')),
('演示AI应用导论',3.0,'2025春',2,(SELECT id FROM class WHERE invite_code='TA2025')),
('演示RAG知识库实践',2.0,'2025春',2,(SELECT id FROM class WHERE invite_code='TA2025')),
('演示数据库建模',3.5,'2025春',2,(SELECT id FROM class WHERE invite_code='TD2025')),
('演示SQL性能优化',2.5,'2025春',2,(SELECT id FROM class WHERE invite_code='TD2025')),
('演示综合项目冲刺',4.0,'2025秋',2,(SELECT id FROM class WHERE invite_code='TS2025')),
('演示期末复盘课',1.5,'2025秋',2,(SELECT id FROM class WHERE invite_code='TS2025'));

-- 更多成绩：默认学生和班级成员都有 GPA 内容
INSERT INTO grade(user_id,course_id,score,grade_point,grade_type,semester,remark) VALUES
(3,(SELECT id FROM course WHERE name='演示Java项目实战' ORDER BY id DESC LIMIT 1),94,4.0,'final','2025春','项目结构清晰'),
(3,(SELECT id FROM course WHERE name='演示Spring Boot专题' ORDER BY id DESC LIMIT 1),88,3.7,'final','2025春','接口设计稳定'),
(3,(SELECT id FROM course WHERE name='演示AI应用导论' ORDER BY id DESC LIMIT 1),91,4.0,'final','2025春','RAG理解较好'),
(3,(SELECT id FROM course WHERE name='演示RAG知识库实践' ORDER BY id DESC LIMIT 1),86,3.7,'final','2025春','召回策略可继续优化'),
(3,(SELECT id FROM course WHERE name='演示数据库建模' ORDER BY id DESC LIMIT 1),83,3.3,'final','2025春','范式掌握中等'),
(3,(SELECT id FROM course WHERE name='演示SQL性能优化' ORDER BY id DESC LIMIT 1),79,3.0,'final','2025春','索引题需复盘'),
(4,(SELECT id FROM course WHERE name='演示Java项目实战' ORDER BY id DESC LIMIT 1),87,3.7,'final','2025春','代码规范较好'),
(5,(SELECT id FROM course WHERE name='演示Java项目实战' ORDER BY id DESC LIMIT 1),76,2.7,'final','2025春','异常处理薄弱'),
(7,(SELECT id FROM course WHERE name='演示Java项目实战' ORDER BY id DESC LIMIT 1),98,4.0,'final','2025春','扩展功能完成度高'),
(8,(SELECT id FROM course WHERE name='演示AI应用导论' ORDER BY id DESC LIMIT 1),84,3.3,'final','2025春','提示词结构不错'),
(9,(SELECT id FROM course WHERE name='演示数据库建模' ORDER BY id DESC LIMIT 1),90,4.0,'final','2025春','ER图表达准确'),
(10,(SELECT id FROM course WHERE name='演示SQL性能优化' ORDER BY id DESC LIMIT 1),81,3.3,'final','2025春','慢查询定位较快'),
(3,(SELECT id FROM course WHERE name='Java程序设计' ORDER BY id DESC LIMIT 1),89,3.7,'final','2025春','继承与接口掌握良好'),
(3,(SELECT id FROM course WHERE name='数据库系统' ORDER BY id DESC LIMIT 1),82,3.3,'final','2025春','事务隔离需要巩固'),
(3,(SELECT id FROM course WHERE name='数据结构' ORDER BY id DESC LIMIT 1),92,4.0,'final','2025春','排序和图算法表现突出');

-- 让仪表盘、待办和日程更丰满
INSERT INTO todo(user_id,title,description,priority,status,due_date,tags,source_type) VALUES
(3,'提交Java项目阶段报告','补充接口截图、数据库表设计和单元测试说明',1,'pending','2025-05-02 23:00:00','Java,项目','assignment'),
(3,'完成RAG实验记录','记录知识库切片参数与回答质量对比',2,'pending','2025-05-04 22:00:00','AI,RAG','assignment'),
(3,'复盘SQL错题','重点看连接查询、索引失效和事务隔离级别',1,'pending','2025-05-06 21:00:00','数据库,错题','manual'),
(3,'整理期中复习清单','按课程拆成知识点、例题、错题三列',2,'completed','2025-04-25 20:00:00','复习','manual'),
(3,'参加AI应用答疑','准备3个RAG项目问题',3,'pending','2025-05-08 19:30:00','答疑,AI','manual'),
(2,'批改演示Java提交','检查模块拆分和异常处理',1,'pending','2025-05-03 18:00:00','批改,Java','assignment'),
(2,'准备数据库建模讲评','挑选3份ER图做课堂讲评',2,'pending','2025-05-06 16:00:00','数据库,讲评','manual'),
(2,'发布AI应用补充资料','上传Prompt模板和评测表',3,'completed','2025-04-26 12:00:00','AI,资料','manual');

INSERT INTO schedule_event(user_id,title,description,start_time,end_time,event_type,color) VALUES
(3,'演示Java项目课','模块拆分与接口联调','2025-05-02 09:00:00','2025-05-02 10:40:00','class','#f97316'),
(3,'RAG实验答疑','知识库召回与引用格式','2025-05-04 19:30:00','2025-05-04 20:30:00','custom','#8b5cf6'),
(3,'数据库建模作业截止','提交ER图与关系模式说明','2025-05-06 23:00:00','2025-05-06 23:30:00','assignment_due','#ef4444'),
(3,'综合项目小组会','确认展示流程与分工','2025-05-09 15:00:00','2025-05-09 16:00:00','custom','#10b981'),
(2,'演示Java项目课','阶段项目讲评','2025-05-02 09:00:00','2025-05-02 10:40:00','class','#f97316'),
(2,'教师办公时间','答疑：AI应用与数据库训练营','2025-05-04 14:00:00','2025-05-04 16:00:00','custom','#06b6d4'),
(2,'数据库建模批改','批改ER图作业','2025-05-07 09:30:00','2025-05-07 11:30:00','custom','#ef4444');

-- 作业：覆盖默认教师和默认学生；含已交、已批、未交、草稿
INSERT INTO assignment(title,description,teacher_id,class_id,max_score,status,due_date,rubric) VALUES
('演示Java项目阶段报告','提交项目结构说明、核心代码片段和运行截图。',2,(SELECT id FROM class WHERE invite_code='TJ2025'),100,'published','2025-05-02 23:00:00','{"结构":30,"代码":40,"说明":30}'),
('演示Spring Boot接口联调','实现用户、课程、作业三个接口并提供测试结果。',2,(SELECT id FROM class WHERE invite_code='TJ2025'),100,'published','2025-05-09 23:00:00','{"接口":45,"测试":35,"文档":20}'),
('演示RAG知识库实验','比较不同切片长度下的回答质量。',2,(SELECT id FROM class WHERE invite_code='TA2025'),100,'published','2025-05-04 22:00:00','{"实验":40,"分析":40,"结论":20}'),
('演示Prompt评测表','设计5个学业问答Prompt并记录评分。',2,(SELECT id FROM class WHERE invite_code='TA2025'),100,'closed','2025-04-24 22:00:00','{"设计":40,"评测":40,"反思":20}'),
('演示数据库ER图','为选课系统设计ER图和关系模式。',2,(SELECT id FROM class WHERE invite_code='TD2025'),100,'published','2025-05-06 23:00:00','{"ER图":45,"关系模式":35,"规范化":20}'),
('演示SQL索引分析','分析三条慢查询并给出索引方案。',2,(SELECT id FROM class WHERE invite_code='TD2025'),100,'published','2025-05-11 23:00:00','{"定位":30,"方案":50,"验证":20}'),
('演示综合项目路演稿','准备期末项目展示脚本和演示流程。',2,(SELECT id FROM class WHERE invite_code='TS2025'),100,'draft','2025-06-01 23:00:00','{"结构":30,"表达":30,"演示":40}');

INSERT IGNORE INTO assignment_submission(assignment_id,student_id,content,file_url,ai_score,ai_feedback,teacher_score,teacher_feedback,status,grade_time)
SELECT a.id,3,'已完成项目阶段报告：包含三层架构图、接口列表和运行截图。','https://example.com/submissions/java-stage-report.pdf',90,'结构完整，建议补充异常流程。',92,'整体完成度高，接口说明清楚。','graded',NOW() FROM assignment a WHERE a.title='演示Java项目阶段报告' UNION ALL
SELECT a.id,4,'提交了模块说明和核心代码，测试截图见附件。','https://example.com/submissions/li-java-report.pdf',84,'测试说明略少。',86,'代码规范不错，补充边界用例会更好。','graded',NOW() FROM assignment a WHERE a.title='演示Java项目阶段报告' UNION ALL
SELECT a.id,5,'项目报告初版，已完成登录和课程管理。','https://example.com/submissions/wang-java-report.pdf',70,'模块完整性不足。',74,'继续补齐作业模块和异常处理。','graded',NOW() FROM assignment a WHERE a.title='演示Java项目阶段报告' UNION ALL
SELECT a.id,7,'提交完整项目报告和演示视频链接。','https://example.com/submissions/chen-java-demo.mp4',96,'功能覆盖全面。',98,'优秀，展示流程清晰。','graded',NOW() FROM assignment a WHERE a.title='演示Java项目阶段报告' UNION ALL
SELECT a.id,3,'RAG实验记录：比较了300、500、800字切片效果，附评测表。','https://example.com/submissions/rag-lab.xlsx',88,'分析维度完整。',NULL,NULL,'submitted',NULL FROM assignment a WHERE a.title='演示RAG知识库实验' UNION ALL
SELECT a.id,8,'Prompt评测表已完成，包含摘要、解释、追问三类任务。','https://example.com/submissions/prompt-eval.xlsx',87,'样例丰富。',89,'评测表清楚，有可复用价值。','graded',NOW() FROM assignment a WHERE a.title='演示Prompt评测表' UNION ALL
SELECT a.id,3,'选课系统ER图：学生、课程、教师、选课记录四个核心实体。','https://example.com/submissions/er-course.png',82,'关系基本正确，基数标注可完善。',NULL,NULL,'submitted',NULL FROM assignment a WHERE a.title='演示数据库ER图' UNION ALL
SELECT a.id,9,'数据库ER图和3NF分析均已提交。','https://example.com/submissions/sun-er.pdf',91,'规范化分析充分。',94,'结构优秀，表达准确。','graded',NOW() FROM assignment a WHERE a.title='演示数据库ER图' UNION ALL
SELECT a.id,10,'慢查询分析：订单表、日志表、关联查询。','https://example.com/submissions/zhou-index.md',80,'索引建议合理。',NULL,NULL,'submitted',NULL FROM assignment a WHERE a.title='演示SQL索引分析';

-- 也给原有作业补充提交，教师 teacher_liu(id=6) 页面更充实
INSERT IGNORE INTO assignment_submission(assignment_id,student_id,content,file_url,ai_score,ai_feedback,teacher_score,teacher_feedback,status,grade_time)
SELECT a.id,3,'完成Java基础语法习题1-10，附关键错题说明。',NULL,86,'基础扎实。',88,'注意格式化输出题。','graded',NOW() FROM assignment a WHERE a.title='Java基础语法' UNION ALL
SELECT a.id,1,'提交课后习题和运行截图。',NULL,92,'完成度高。',94,'很好。','graded',NOW() FROM assignment a WHERE a.title='Java基础语法' UNION ALL
SELECT a.id,2,'完成SQL查询练习，包含连接查询和聚合查询。',NULL,78,'连接查询仍需复习。',80,'再看一下子查询优化。','graded',NOW() FROM assignment a WHERE a.title='SQL查询练习' UNION ALL
SELECT a.id,5,'提交响应式页面源码和截图。','https://example.com/submissions/web-layout.zip',85,'布局基本完整。',NULL,NULL,'submitted',NULL FROM assignment a WHERE a.title='HTML/CSS布局';

-- 错题、笔记、讨论继续扩容
INSERT INTO wrong_question(user_id,subject,content,correct_answer,my_answer,ai_analysis,knowledge_point,mastery,source) VALUES
(3,'Java','try-with-resources 适用于什么对象？','实现 AutoCloseable 的资源对象','所有对象','需要关注接口约束，只有实现 AutoCloseable/Closeable 才会自动关闭。','异常处理','reviewing','assignment'),
(3,'Spring Boot','Controller 返回 JSON 通常依赖哪个注解？','@RestController 或 @ResponseBody','@Controller','@Controller 默认返回视图，需要 @ResponseBody 才写入响应体。','MVC','unmastered','manual'),
(3,'AI应用','RAG 中 chunk size 过大有什么风险？','召回不精准、上下文噪声增加','回答更完整','需要平衡召回粒度和上下文噪声。','RAG','reviewing','assignment'),
(3,'数据库','可重复读是否一定避免幻读？','MySQL InnoDB 在当前读下需借助间隙锁','一定避免','不同数据库实现不同，需结合隔离级别与锁机制。','事务隔离','unmastered','manual'),
(4,'Java','HashSet 如何判断元素重复？','hashCode 与 equals','只看 equals','先定位桶，再用 equals 判等。','集合','reviewing','manual'),
(5,'数据库','联合索引最左前缀原则是什么？','从索引最左列开始连续匹配','任意列都可以','跳过左列通常无法充分利用索引。','索引','unmastered','manual'),
(8,'AI应用','Prompt 中约束输出格式的意义？','降低解析成本、提升稳定性','让回答更长','结构化输出便于程序消费。','Prompt','mastered','manual');

INSERT INTO notebook(user_id,course_id,title,content,ai_summary,tags,is_shared) VALUES
(3,(SELECT id FROM course WHERE name='演示Java项目实战' ORDER BY id DESC LIMIT 1),'项目分层设计清单','## 分层\n- Controller 只处理请求\n- Service 负责业务\n- Mapper 负责数据访问','三层职责清晰，后续可补充异常处理模板。','Java,项目',true),
(3,(SELECT id FROM course WHERE name='演示AI应用导论' ORDER BY id DESC LIMIT 1),'RAG实验观察','不同 chunk size 对召回命中率影响明显，500字左右较平衡。','记录了实验变量、结果和改进方向。','AI,RAG',true),
(3,(SELECT id FROM course WHERE name='演示数据库建模' ORDER BY id DESC LIMIT 1),'ER图检查表','实体、属性、主键、联系、基数、弱实体逐项检查。','适合作为建模作业提交前清单。','数据库,ER图',false),
(4,(SELECT id FROM course WHERE name='演示Spring Boot专题' ORDER BY id DESC LIMIT 1),'接口测试笔记','Postman 环境变量、鉴权 Cookie、错误响应统一格式。','接口调试流程完整。','Spring Boot,接口',true),
(8,(SELECT id FROM course WHERE name='演示AI应用导论' ORDER BY id DESC LIMIT 1),'Prompt模板库','角色、任务、约束、输出格式、示例五段式。','可复用为学业问答模板。','Prompt,AI',true);

INSERT INTO post(user_id,course_id,title,content,tags,is_pinned,is_featured,view_count,reply_count) VALUES
(3,(SELECT id FROM course WHERE name='演示Java项目实战' ORDER BY id DESC LIMIT 1),'项目分层到底要不要 DTO？','Controller 直接返回 Entity 会有什么问题？','Java,项目',false,true,76,0),
(4,(SELECT id FROM course WHERE name='演示AI应用导论' ORDER BY id DESC LIMIT 1),'RAG实验里引用来源怎么展示？','希望回答里能标注来自哪个文档片段。','AI,RAG',true,false,112,0),
(8,(SELECT id FROM course WHERE name='演示AI应用导论' ORDER BY id DESC LIMIT 1),'Prompt评测分数如何设计？','准确性、格式稳定性、可解释性权重怎么分配？','Prompt,评测',false,false,48,0),
(9,(SELECT id FROM course WHERE name='演示数据库建模' ORDER BY id DESC LIMIT 1),'ER图里多对多关系要不要拆表？','选课系统中学生和课程之间的选课记录怎么建模？','数据库,ER图',false,true,84,0);

INSERT INTO post_reply(post_id,user_id,content,is_ai_generated)
SELECT p.id,2,'建议 DTO 用于隔离接口字段和数据库字段，尤其是有敏感字段或组合字段时。',false FROM post p WHERE p.title='项目分层到底要不要 DTO？' UNION ALL
SELECT p.id,7,'我的做法是 Entity 转 VO，表单入参用 Request 对象。',false FROM post p WHERE p.title='项目分层到底要不要 DTO？' UNION ALL
SELECT p.id,2,'可以在回答末尾输出来源列表，也可以在每段后加 [文档-片段] 标记。',false FROM post p WHERE p.title='RAG实验里引用来源怎么展示？' UNION ALL
SELECT p.id,3,'我用表格记录命中片段、答案覆盖点和是否幻觉，比较直观。',false FROM post p WHERE p.title='RAG实验里引用来源怎么展示？' UNION ALL
SELECT p.id,6,'建议准确性 50%，格式稳定 30%，可解释性 20%，后续再按项目调整。',false FROM post p WHERE p.title='Prompt评测分数如何设计？' UNION ALL
SELECT p.id,2,'多对多通常拆成关联表，选课记录还可以放成绩、选课时间等属性。',false FROM post p WHERE p.title='ER图里多对多关系要不要拆表？';

-- 打卡、积分、成就：让打卡页有连续曲线和积分变化
INSERT IGNORE INTO checkin(user_id,checkin_date,study_minutes,content) VALUES
(3,'2025-04-23',95,'完成Java项目分层重构'),
(3,'2025-04-24',110,'RAG实验与Prompt评测'),
(3,'2025-04-25',80,'复盘数据库范式'),
(3,'2025-04-26',130,'完成ER图草稿'),
(3,'2025-04-27',75,'整理错题本'),
(3,'2025-04-28',120,'准备作业提交'),
(3,'2025-04-29',90,'刷数据结构题'),
(3,'2025-04-30',105,'复习Spring Boot接口'),
(2,'2025-04-23',60,'批改Java项目报告'),
(2,'2025-04-24',80,'准备AI应用案例'),
(2,'2025-04-25',75,'整理数据库讲评'),
(2,'2025-04-26',45,'上传课程资料'),
(2,'2025-04-27',100,'设计期中测验'),
(2,'2025-04-28',90,'答疑与课堂反馈');

INSERT INTO points_log(user_id,action,points,description) VALUES
(3,'checkin',10,'每日打卡 +10'),(3,'checkin',10,'每日打卡 +10'),(3,'checkin',10,'每日打卡 +10'),
(3,'assignment',20,'提交作业 +20'),(3,'reply',3,'参与讨论 +3'),(3,'post',5,'发布帖子 +5'),
(3,'checkin',10,'每日打卡 +10'),(3,'assignment',20,'提交作业 +20'),(3,'checkin',10,'每日打卡 +10'),
(2,'checkin',10,'每日打卡 +10'),(2,'post',5,'发布讨论 +5'),(2,'reply',3,'回复学生 +3'),(2,'assignment',20,'批改作业 +20');

INSERT IGNORE INTO user_achievement(user_id,achievement_id) VALUES
(3,1),(3,2),(3,5),(3,6),(3,7),(3,8),
(2,1),(2,2),(2,5),(2,7);

-- 考试：默认教师创建，默认学生可见；含题目和已提交成绩统计
INSERT INTO exam(title,course_id,teacher_id,class_id,duration,total_score,status,start_time,end_time) VALUES
('演示Java项目测验',(SELECT id FROM course WHERE name='演示Java项目实战' ORDER BY id DESC LIMIT 1),2,(SELECT id FROM class WHERE invite_code='TJ2025'),45,60,'published','2025-05-03 09:00:00','2025-05-03 10:00:00'),
('演示AI应用小测',(SELECT id FROM course WHERE name='演示AI应用导论' ORDER BY id DESC LIMIT 1),2,(SELECT id FROM class WHERE invite_code='TA2025'),40,50,'published','2025-05-05 19:00:00','2025-05-05 20:00:00'),
('演示数据库建模测验',(SELECT id FROM course WHERE name='演示数据库建模' ORDER BY id DESC LIMIT 1),2,(SELECT id FROM class WHERE invite_code='TD2025'),60,80,'published','2025-05-08 14:00:00','2025-05-08 15:30:00');

INSERT INTO exam_question(exam_id,type,content,options,answer,score,sort_order)
SELECT e.id,'choice','Controller 层最适合负责什么？','A. SQL拼接\nB. HTTP请求响应适配\nC. 复杂业务规则\nD. 数据库连接池管理','B',10,1 FROM exam e WHERE e.title='演示Java项目测验' UNION ALL
SELECT e.id,'true_false','DTO 可以减少接口字段与数据库字段的耦合。','','对',10,2 FROM exam e WHERE e.title='演示Java项目测验' UNION ALL
SELECT e.id,'fill','Spring Boot 常用的依赖注入注解之一是 ____。','','@Autowired',10,3 FROM exam e WHERE e.title='演示Java项目测验' UNION ALL
SELECT e.id,'short_answer','简述 Service 层存在的意义。','','封装业务逻辑，协调多个数据访问或外部服务，保持 Controller 简洁。',30,4 FROM exam e WHERE e.title='演示Java项目测验' UNION ALL
SELECT e.id,'choice','RAG 的核心流程通常包括？','A. 检索-增强-生成\nB. 编译-链接-运行\nC. 登录-注册-退出\nD. 排序-分页-缓存','A',10,1 FROM exam e WHERE e.title='演示AI应用小测' UNION ALL
SELECT e.id,'true_false','chunk size 越大，召回一定越精准。','','错',10,2 FROM exam e WHERE e.title='演示AI应用小测' UNION ALL
SELECT e.id,'fill','Prompt 中要求固定 JSON 输出属于 ____ 约束。','','格式',10,3 FROM exam e WHERE e.title='演示AI应用小测' UNION ALL
SELECT e.id,'short_answer','为什么 RAG 需要引用来源？','','便于用户核验答案依据，降低幻觉风险，提高回答可信度。',20,4 FROM exam e WHERE e.title='演示AI应用小测' UNION ALL
SELECT e.id,'choice','多对多关系在关系模型中通常如何实现？','A. 删除其中一个实体\nB. 增加关联表\nC. 全部字段放一张表\nD. 使用视图替代','B',10,1 FROM exam e WHERE e.title='演示数据库建模测验' UNION ALL
SELECT e.id,'true_false','第三范式要求消除非主属性对码的传递依赖。','','对',10,2 FROM exam e WHERE e.title='演示数据库建模测验' UNION ALL
SELECT e.id,'fill','事务 ACID 中 I 代表 ____。','','隔离性',10,3 FROM exam e WHERE e.title='演示数据库建模测验' UNION ALL
SELECT e.id,'short_answer','简述索引失效的常见场景。','','函数包裹索引列、隐式类型转换、like 前置通配、跳过联合索引最左列等。',50,4 FROM exam e WHERE e.title='演示数据库建模测验';

INSERT IGNORE INTO exam_submission(exam_id,student_id,answers,score,ai_feedback,status,start_time,submit_time)
SELECT e.id,3,'{"1":"B","2":"对","3":"@Autowired","4":"封装业务逻辑并协调Mapper"}',54,'基础概念掌握较好，简答题可补充事务边界。','graded','2025-05-03 09:05:00','2025-05-03 09:42:00' FROM exam e WHERE e.title='演示Java项目测验' UNION ALL
SELECT e.id,4,'{"1":"B","2":"对","3":"@Resource","4":"让Controller更简洁"}',48,'整体正确，依赖注入注解答案可接受。','graded','2025-05-03 09:02:00','2025-05-03 09:44:00' FROM exam e WHERE e.title='演示Java项目测验' UNION ALL
SELECT e.id,5,'{"1":"C","2":"对","3":"Controller","4":"写业务"}',36,'层次职责仍需巩固。','graded','2025-05-03 09:03:00','2025-05-03 09:40:00' FROM exam e WHERE e.title='演示Java项目测验' UNION ALL
SELECT e.id,7,'{"1":"B","2":"对","3":"@Autowired","4":"封装业务逻辑、事务、外部服务调用"}',58,'回答完整。','graded','2025-05-03 09:01:00','2025-05-03 09:35:00' FROM exam e WHERE e.title='演示Java项目测验' UNION ALL
SELECT e.id,3,'{"1":"A","2":"错","3":"格式","4":"方便核验依据"}',45,'RAG流程掌握稳定。','graded','2025-05-05 19:03:00','2025-05-05 19:35:00' FROM exam e WHERE e.title='演示AI应用小测' UNION ALL
SELECT e.id,8,'{"1":"A","2":"错","3":"格式","4":"降低幻觉并提升可信度"}',48,'来源解释清晰。','graded','2025-05-05 19:01:00','2025-05-05 19:32:00' FROM exam e WHERE e.title='演示AI应用小测' UNION ALL
SELECT e.id,9,'{"1":"B","2":"对","3":"隔离性","4":"函数、类型转换、like前缀通配"}',72,'建模和索引知识掌握较好。','graded','2025-05-08 14:05:00','2025-05-08 14:52:00' FROM exam e WHERE e.title='演示数据库建模测验' UNION ALL
SELECT e.id,10,'{"1":"B","2":"对","3":"Isolation","4":"跳过联合索引最左列"}',64,'英文答案可接受，简答覆盖点偏少。','graded','2025-05-08 14:08:00','2025-05-08 15:00:00' FROM exam e WHERE e.title='演示数据库建模测验';

-- 知识库/历史/星图：让文档、历史会话、学习画像面板不空
INSERT INTO document(name,uploader_id,stored_filename) VALUES
('Java项目实战讲义.md',2,'seed/java-project-guide.md'),
('RAG知识库实验说明.md',2,'seed/rag-lab-guide.md'),
('数据库建模案例.pdf',2,'seed/database-modeling-case.pdf'),
('期中复习清单.md',3,'seed/midterm-review-list.md');

INSERT INTO document_chunk(document_id,content,chunk_index)
SELECT d.id,'Java项目分层建议：Controller 负责请求响应适配，Service 封装业务流程，Mapper 只处理数据库访问。',0 FROM document d WHERE d.name='Java项目实战讲义.md' UNION ALL
SELECT d.id,'RAG实验建议记录问题、命中文档、答案依据、是否幻觉和改进措施。',0 FROM document d WHERE d.name='RAG知识库实验说明.md' UNION ALL
SELECT d.id,'数据库建模案例包含学生、课程、教师、选课记录四类实体，并通过选课记录拆解多对多关系。',0 FROM document d WHERE d.name='数据库建模案例.pdf' UNION ALL
SELECT d.id,'期中复习清单：Java集合、Spring接口、SQL连接查询、事务隔离、RAG基础概念。',0 FROM document d WHERE d.name='期中复习清单.md';

INSERT INTO chat_session(user_id,title) VALUES
(3,'Java项目分层答疑'),
(3,'RAG实验报告润色'),
(3,'数据库范式复习'),
(3,'数据结构复杂度星图'),
(3,'操作系统进程复习'),
(3,'计算机网络协议追问'),
(3,'Spring Boot接口调试'),
(2,'AI应用课程备课'),
(2,'数据库训练营备课'),
(2,'Java项目讲评准备');

INSERT INTO chat_message(session_id,role,content)
SELECT s.id,'user','Controller 层可以直接返回 Entity 吗？' FROM chat_session s WHERE s.title='Java项目分层答疑' UNION ALL
SELECT s.id,'assistant','可以，但不推荐。DTO/VO 能隔离数据库字段和接口字段，也便于隐藏敏感信息。' FROM chat_session s WHERE s.title='Java项目分层答疑' UNION ALL
SELECT s.id,'user','Service 层应该负责事务还是 Mapper 负责？' FROM chat_session s WHERE s.title='Java项目分层答疑' UNION ALL
SELECT s.id,'assistant','事务一般放在 Service 层，因为一次业务操作可能协调多个 Mapper 或外部服务。' FROM chat_session s WHERE s.title='Java项目分层答疑' UNION ALL
SELECT s.id,'user','帮我把 RAG 实验结论写得更清楚。' FROM chat_session s WHERE s.title='RAG实验报告润色' UNION ALL
SELECT s.id,'assistant','可以按“实验设置、观察结果、原因分析、后续改进”四段展开。' FROM chat_session s WHERE s.title='RAG实验报告润色' UNION ALL
SELECT s.id,'user','RAG 回答里怎么标注引用来源？' FROM chat_session s WHERE s.title='RAG实验报告润色' UNION ALL
SELECT s.id,'assistant','可以在每段后标注资料编号，并在末尾列出资料名称、片段摘要和命中原因。' FROM chat_session s WHERE s.title='RAG实验报告润色' UNION ALL
SELECT s.id,'user','第三范式和BCNF怎么区分？' FROM chat_session s WHERE s.title='数据库范式复习' UNION ALL
SELECT s.id,'assistant','第三范式允许部分非平凡依赖的决定因素不是候选码，BCNF要求每个非平凡依赖的决定因素都是候选码。' FROM chat_session s WHERE s.title='数据库范式复习' UNION ALL
SELECT s.id,'user','联合索引最左前缀原则怎么判断？' FROM chat_session s WHERE s.title='数据库范式复习' UNION ALL
SELECT s.id,'assistant','从联合索引最左列开始连续匹配，遇到范围查询后，后续列通常难以继续用于精确定位。' FROM chat_session s WHERE s.title='数据库范式复习' UNION ALL
SELECT s.id,'user','快速排序为什么平均复杂度是 O(nlogn)？' FROM chat_session s WHERE s.title='数据结构复杂度星图' UNION ALL
SELECT s.id,'assistant','平均情况下每轮划分较均衡，递归深度约 logn，每层处理 n 个元素，所以是 O(nlogn)。' FROM chat_session s WHERE s.title='数据结构复杂度星图' UNION ALL
SELECT s.id,'user','图的 BFS 和 DFS 分别适合什么场景？' FROM chat_session s WHERE s.title='数据结构复杂度星图' UNION ALL
SELECT s.id,'assistant','BFS 常用于最短层级路径，DFS 常用于连通性、回溯和拓扑相关搜索。' FROM chat_session s WHERE s.title='数据结构复杂度星图' UNION ALL
SELECT s.id,'user','进程和线程的区别是什么？' FROM chat_session s WHERE s.title='操作系统进程复习' UNION ALL
SELECT s.id,'assistant','进程是资源分配单位，线程是 CPU 调度单位，同一进程内线程共享地址空间。' FROM chat_session s WHERE s.title='操作系统进程复习' UNION ALL
SELECT s.id,'user','死锁四个必要条件怎么记？' FROM chat_session s WHERE s.title='操作系统进程复习' UNION ALL
SELECT s.id,'assistant','互斥、占有并等待、不可抢占、循环等待。破坏任一条件即可预防死锁。' FROM chat_session s WHERE s.title='操作系统进程复习' UNION ALL
SELECT s.id,'user','TCP 三次握手每一步的目的是什么？' FROM chat_session s WHERE s.title='计算机网络协议追问' UNION ALL
SELECT s.id,'assistant','第一次确认客户端发送能力，第二次确认服务端收发能力，第三次确认客户端接收能力。' FROM chat_session s WHERE s.title='计算机网络协议追问' UNION ALL
SELECT s.id,'user','HTTP 状态码 401 和 403 有什么区别？' FROM chat_session s WHERE s.title='计算机网络协议追问' UNION ALL
SELECT s.id,'assistant','401 表示未认证或认证失效，403 表示已认证但权限不足。' FROM chat_session s WHERE s.title='计算机网络协议追问' UNION ALL
SELECT s.id,'user','Spring Boot 接口联调时 Cookie 没带上怎么办？' FROM chat_session s WHERE s.title='Spring Boot接口调试' UNION ALL
SELECT s.id,'assistant','先确认前端 axios 是否开启 withCredentials，再看后端 CORS 和 Session Cookie 的 SameSite/Domain 设置。' FROM chat_session s WHERE s.title='Spring Boot接口调试' UNION ALL
SELECT s.id,'user','MyBatis 字段映射为空一般查哪里？' FROM chat_session s WHERE s.title='Spring Boot接口调试' UNION ALL
SELECT s.id,'assistant','优先检查 resultMap、列别名、Java 属性名和下划线转驼峰配置是否一致。' FROM chat_session s WHERE s.title='Spring Boot接口调试' UNION ALL
SELECT s.id,'user','给AI应用课设计一个RAG课堂练习。' FROM chat_session s WHERE s.title='AI应用课程备课' UNION ALL
SELECT s.id,'assistant','可以让学生上传一份课程讲义，设计3个问题，对比不同切片长度下答案依据和稳定性。' FROM chat_session s WHERE s.title='AI应用课程备课' UNION ALL
SELECT s.id,'user','数据库训练营怎么安排索引实验？' FROM chat_session s WHERE s.title='数据库训练营备课' UNION ALL
SELECT s.id,'assistant','准备一张百万级模拟订单表，让学生先 EXPLAIN，再添加单列索引和联合索引对比。' FROM chat_session s WHERE s.title='数据库训练营备课' UNION ALL
SELECT s.id,'user','Java项目讲评要重点看哪些问题？' FROM chat_session s WHERE s.title='Java项目讲评准备' UNION ALL
SELECT s.id,'assistant','重点看分层职责、异常处理、接口契约、数据库事务和测试覆盖。' FROM chat_session s WHERE s.title='Java项目讲评准备';

INSERT INTO user_question_log(user_id,question,topic,session_id) VALUES
(3,'Java项目怎么分层？','Java',(SELECT id FROM chat_session WHERE title='Java项目分层答疑' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'DTO和VO有什么区别？','Java',(SELECT id FROM chat_session WHERE title='Java项目分层答疑' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'Service 层应该负责事务还是 Mapper 负责？','Java',(SELECT id FROM chat_session WHERE title='Java项目分层答疑' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'RAG实验怎么写结论？','AI应用',(SELECT id FROM chat_session WHERE title='RAG实验报告润色' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'chunk size 怎么选择？','AI应用',(SELECT id FROM chat_session WHERE title='RAG实验报告润色' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'RAG 回答里怎么标注引用来源？','AI应用',(SELECT id FROM chat_session WHERE title='RAG实验报告润色' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'第三范式和BCNF怎么区分？','数据库',(SELECT id FROM chat_session WHERE title='数据库范式复习' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'联合索引什么时候失效？','数据库',(SELECT id FROM chat_session WHERE title='数据库范式复习' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'联合索引最左前缀原则怎么判断？','数据库',(SELECT id FROM chat_session WHERE title='数据库范式复习' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'事务隔离级别有哪些？','数据库',(SELECT id FROM chat_session WHERE title='数据库范式复习' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'快速排序为什么平均是nlogn？','数据结构',(SELECT id FROM chat_session WHERE title='数据结构复杂度星图' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'快速排序为什么平均复杂度是 O(nlogn)？','数据结构',(SELECT id FROM chat_session WHERE title='数据结构复杂度星图' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'图的 BFS 和 DFS 分别适合什么场景？','数据结构',(SELECT id FROM chat_session WHERE title='数据结构复杂度星图' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'进程和线程的区别是什么？','操作系统',(SELECT id FROM chat_session WHERE title='操作系统进程复习' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'死锁四个必要条件怎么记？','操作系统',(SELECT id FROM chat_session WHERE title='操作系统进程复习' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'TCP 三次握手每一步的目的是什么？','计算机网络',(SELECT id FROM chat_session WHERE title='计算机网络协议追问' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'HTTP 状态码 401 和 403 有什么区别？','计算机网络',(SELECT id FROM chat_session WHERE title='计算机网络协议追问' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'Spring Boot 接口联调时 Cookie 没带上怎么办？','Spring Boot',(SELECT id FROM chat_session WHERE title='Spring Boot接口调试' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(3,'MyBatis 字段映射为空一般查哪里？','Spring Boot',(SELECT id FROM chat_session WHERE title='Spring Boot接口调试' AND user_id=3 ORDER BY id DESC LIMIT 1)),
(2,'给AI应用课设计一个RAG课堂练习。','AI应用',(SELECT id FROM chat_session WHERE title='AI应用课程备课' AND user_id=2 ORDER BY id DESC LIMIT 1)),
(2,'数据库训练营怎么安排索引实验？','数据库',(SELECT id FROM chat_session WHERE title='数据库训练营备课' AND user_id=2 ORDER BY id DESC LIMIT 1)),
(2,'Java项目讲评要重点看哪些问题？','Java',(SELECT id FROM chat_session WHERE title='Java项目讲评准备' AND user_id=2 ORDER BY id DESC LIMIT 1));

INSERT INTO learning_profile(user_id,weak_topics,strong_topics,suggestion) VALUES
(3,'数据库','Java','你在数据库相关问题上提问较多，建议重点复习事务隔离、索引失效和范式设计；Java 项目分层掌握较好，可以继续做综合项目。'),
(2,'AI应用','Java','教师端最近围绕 AI 应用与数据库训练营备课较多，可把 RAG 课堂练习和索引实验沉淀为可复用教案。')
ON DUPLICATE KEY UPDATE weak_topics=VALUES(weak_topics), strong_topics=VALUES(strong_topics), suggestion=VALUES(suggestion);
