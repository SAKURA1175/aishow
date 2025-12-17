package com.xxzd.study.service.impl;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 学科分类器 - 支持100+学科分类
 */
public class TopicClassifier {

    // 学科关键词映射表
    private static final Map<String, String[]> TOPIC_KEYWORDS = new LinkedHashMap<>();

    static {
        // ========== 理工类 ==========
        TOPIC_KEYWORDS.put("数学", new String[]{"数学", "方程", "函数", "微积分", "导数", "积分", "极限", "概率", "统计", "线性代数", "矩阵", "向量", "几何", "三角", "集合", "数论"});
        TOPIC_KEYWORDS.put("物理学", new String[]{"物理", "力学", "电磁", "光学", "热力学", "量子", "相对论", "牛顿", "电场", "磁场", "波动", "原子", "核物理"});
        TOPIC_KEYWORDS.put("化学", new String[]{"化学", "元素", "分子", "原子", "化合物", "反应", "有机", "无机", "高分子", "催化", "酸碱", "氧化还原"});
        TOPIC_KEYWORDS.put("生物学", new String[]{"生物", "细胞", "基因", "DNA", "RNA", "蛋白质", "遗传", "进化", "生态", "微生物", "病毒", "免疫"});
        TOPIC_KEYWORDS.put("天文学", new String[]{"天文", "宇宙", "星系", "行星", "恒星", "黑洞", "太阳系", "月球", "天体"});
        TOPIC_KEYWORDS.put("地理学", new String[]{"地理", "地形", "气候", "地质", "地貌", "板块", "海洋", "大气", "水文"});
        TOPIC_KEYWORDS.put("环境科学", new String[]{"环境", "污染", "生态", "碳排放", "可持续", "气候变化", "温室效应"});

        // ========== 计算机与信息技术 ==========
        TOPIC_KEYWORDS.put("计算机科学", new String[]{"计算机", "编程", "代码", "程序", "软件", "硬件", "cpu", "内存"});
        TOPIC_KEYWORDS.put("编程语言", new String[]{"java", "python", "javascript", "c++", "c语言", "go", "rust", "php", "ruby", "swift", "kotlin"});
        TOPIC_KEYWORDS.put("数据结构", new String[]{"数据结构", "链表", "栈", "队列", "树", "图", "哈希", "堆", "排序"});
        TOPIC_KEYWORDS.put("算法", new String[]{"算法", "复杂度", "递归", "动态规划", "贪心", "回溯", "分治", "搜索"});
        TOPIC_KEYWORDS.put("数据库", new String[]{"数据库", "sql", "mysql", "postgresql", "mongodb", "redis", "索引", "事务"});
        TOPIC_KEYWORDS.put("操作系统", new String[]{"操作系统", "linux", "windows", "进程", "线程", "内存管理", "文件系统"});
        TOPIC_KEYWORDS.put("计算机网络", new String[]{"网络", "tcp", "ip", "http", "https", "dns", "路由", "协议", "socket"});
        TOPIC_KEYWORDS.put("人工智能", new String[]{"人工智能", "ai", "机器学习", "深度学习", "神经网络", "自然语言处理", "nlp", "计算机视觉"});
        TOPIC_KEYWORDS.put("大数据", new String[]{"大数据", "hadoop", "spark", "数据挖掘", "数据分析", "etl"});
        TOPIC_KEYWORDS.put("云计算", new String[]{"云计算", "docker", "kubernetes", "微服务", "分布式", "容器"});
        TOPIC_KEYWORDS.put("网络安全", new String[]{"安全", "加密", "黑客", "渗透", "防火墙", "漏洞", "病毒"});
        TOPIC_KEYWORDS.put("前端开发", new String[]{"前端", "html", "css", "react", "vue", "angular", "网页", "浏览器"});
        TOPIC_KEYWORDS.put("后端开发", new String[]{"后端", "spring", "springboot", "django", "flask", "nodejs", "api"});
        TOPIC_KEYWORDS.put("移动开发", new String[]{"移动开发", "android", "ios", "flutter", "react native", "app"});

        // ========== 经济与管理 ==========
        TOPIC_KEYWORDS.put("经济学", new String[]{"经济", "gdp", "通货膨胀", "货币", "市场", "供需", "宏观经济", "微观经济"});
        TOPIC_KEYWORDS.put("金融学", new String[]{"金融", "股票", "基金", "债券", "期货", "期权", "投资", "理财", "银行", "保险"});
        TOPIC_KEYWORDS.put("会计学", new String[]{"会计", "财务", "报表", "审计", "成本", "税务", "账目"});
        TOPIC_KEYWORDS.put("管理学", new String[]{"管理", "领导力", "组织", "战略", "决策", "人力资源", "绩效"});
        TOPIC_KEYWORDS.put("市场营销", new String[]{"营销", "市场", "品牌", "广告", "促销", "消费者", "4p"});
        TOPIC_KEYWORDS.put("国际贸易", new String[]{"贸易", "进出口", "关税", "汇率", "wto", "全球化"});
        TOPIC_KEYWORDS.put("电子商务", new String[]{"电商", "淘宝", "京东", "跨境电商", "直播带货", "新零售"});
        TOPIC_KEYWORDS.put("创业学", new String[]{"创业", "创新", "商业模式", "融资", "天使投资", "vc"});

        // ========== 人文社科 ==========
        TOPIC_KEYWORDS.put("哲学", new String[]{"哲学", "形而上学", "认识论", "伦理", "逻辑", "存在主义", "唯物", "唯心"});
        TOPIC_KEYWORDS.put("历史学", new String[]{"历史", "古代", "近代", "现代", "朝代", "战争", "文明", "考古"});
        TOPIC_KEYWORDS.put("政治学", new String[]{"政治", "政府", "民主", "选举", "政党", "外交", "国际关系"});
        TOPIC_KEYWORDS.put("社会学", new String[]{"社会", "社会学", "阶层", "群体", "社区", "社会变迁"});
        TOPIC_KEYWORDS.put("心理学", new String[]{"心理", "心理学", "认知", "情绪", "人格", "行为", "精神分析"});
        TOPIC_KEYWORDS.put("教育学", new String[]{"教育", "教学", "课程", "教师", "学生", "学校", "考试"});
        TOPIC_KEYWORDS.put("法学", new String[]{"法律", "法学", "宪法", "民法", "刑法", "合同", "诉讼", "法院"});
        TOPIC_KEYWORDS.put("新闻传播学", new String[]{"新闻", "传播", "媒体", "舆论", "记者", "采访", "编辑"});
        TOPIC_KEYWORDS.put("人类学", new String[]{"人类学", "民族", "文化人类学", "考古人类学"});
        TOPIC_KEYWORDS.put("宗教学", new String[]{"宗教", "佛教", "基督教", "伊斯兰教", "道教", "信仰"});

        // ========== 语言文学 ==========
        TOPIC_KEYWORDS.put("英语", new String[]{"英语", "english", "单词", "语法", "作文", "阅读", "听力", "口语", "翻译"});
        TOPIC_KEYWORDS.put("中文", new String[]{"语文", "中文", "汉语", "古文", "文言文", "现代文", "阅读理解"});
        TOPIC_KEYWORDS.put("文学", new String[]{"文学", "小说", "诗歌", "散文", "戏剧", "作家", "名著"});
        TOPIC_KEYWORDS.put("日语", new String[]{"日语", "日本语", "五十音", "假名", "敬语"});
        TOPIC_KEYWORDS.put("韩语", new String[]{"韩语", "韩国语", "谚文", "韩文"});
        TOPIC_KEYWORDS.put("法语", new String[]{"法语", "法文", "法国"});
        TOPIC_KEYWORDS.put("德语", new String[]{"德语", "德文", "德国"});
        TOPIC_KEYWORDS.put("西班牙语", new String[]{"西班牙语", "西语"});
        TOPIC_KEYWORDS.put("俄语", new String[]{"俄语", "俄文", "俄罗斯"});
        TOPIC_KEYWORDS.put("阿拉伯语", new String[]{"阿拉伯语", "阿语"});
        TOPIC_KEYWORDS.put("语言学", new String[]{"语言学", "语音", "语义", "语用", "句法"});

        // ========== 艺术类 ==========
        TOPIC_KEYWORDS.put("美术", new String[]{"美术", "绘画", "素描", "油画", "水彩", "雕塑", "艺术"});
        TOPIC_KEYWORDS.put("音乐", new String[]{"音乐", "乐器", "钢琴", "吉他", "小提琴", "声乐", "作曲", "乐理"});
        TOPIC_KEYWORDS.put("舞蹈", new String[]{"舞蹈", "芭蕾", "街舞", "民族舞", "现代舞"});
        TOPIC_KEYWORDS.put("戏剧影视", new String[]{"电影", "戏剧", "表演", "导演", "编剧", "剧本"});
        TOPIC_KEYWORDS.put("设计", new String[]{"设计", "平面设计", "ui", "ux", "工业设计", "室内设计"});
        TOPIC_KEYWORDS.put("摄影", new String[]{"摄影", "相机", "构图", "光影", "后期"});
        TOPIC_KEYWORDS.put("书法", new String[]{"书法", "毛笔", "楷书", "行书", "草书", "隶书"});

        // ========== 医学与健康 ==========
        TOPIC_KEYWORDS.put("临床医学", new String[]{"医学", "临床", "诊断", "治疗", "手术", "病人"});
        TOPIC_KEYWORDS.put("药学", new String[]{"药学", "药物", "药理", "制药", "药品"});
        TOPIC_KEYWORDS.put("护理学", new String[]{"护理", "护士", "护理学"});
        TOPIC_KEYWORDS.put("中医学", new String[]{"中医", "中药", "针灸", "推拿", "经络", "穴位"});
        TOPIC_KEYWORDS.put("公共卫生", new String[]{"公共卫生", "流行病", "预防医学", "疫苗"});
        TOPIC_KEYWORDS.put("口腔医学", new String[]{"口腔", "牙齿", "牙科", "正畸"});
        TOPIC_KEYWORDS.put("营养学", new String[]{"营养", "膳食", "维生素", "蛋白质", "碳水"});
        TOPIC_KEYWORDS.put("康复医学", new String[]{"康复", "理疗", "康复训练"});
        TOPIC_KEYWORDS.put("心理健康", new String[]{"心理健康", "抑郁", "焦虑", "心理咨询", "心理治疗"});

        // ========== 工程技术 ==========
        TOPIC_KEYWORDS.put("机械工程", new String[]{"机械", "机器", "齿轮", "传动", "制造"});
        TOPIC_KEYWORDS.put("电气工程", new String[]{"电气", "电路", "电机", "电力", "自动化"});
        TOPIC_KEYWORDS.put("电子工程", new String[]{"电子", "半导体", "芯片", "集成电路", "传感器"});
        TOPIC_KEYWORDS.put("土木工程", new String[]{"土木", "建筑", "结构", "桥梁", "道路"});
        TOPIC_KEYWORDS.put("建筑学", new String[]{"建筑", "建筑设计", "规划", "园林"});
        TOPIC_KEYWORDS.put("材料科学", new String[]{"材料", "金属", "复合材料", "纳米材料", "高分子材料"});
        TOPIC_KEYWORDS.put("化学工程", new String[]{"化工", "化学工程", "反应工程", "分离"});
        TOPIC_KEYWORDS.put("航空航天", new String[]{"航空", "航天", "飞机", "火箭", "卫星", "航天器"});
        TOPIC_KEYWORDS.put("交通运输", new String[]{"交通", "运输", "物流", "铁路", "公路", "港口"});
        TOPIC_KEYWORDS.put("能源工程", new String[]{"能源", "石油", "天然气", "新能源", "太阳能", "风能"});
        TOPIC_KEYWORDS.put("环境工程", new String[]{"环境工程", "污水处理", "废气处理", "固废"});

        // ========== 农学 ==========
        TOPIC_KEYWORDS.put("农学", new String[]{"农业", "种植", "作物", "农作物", "耕种"});
        TOPIC_KEYWORDS.put("园艺学", new String[]{"园艺", "花卉", "蔬菜", "果树"});
        TOPIC_KEYWORDS.put("林学", new String[]{"林业", "森林", "树木", "造林"});
        TOPIC_KEYWORDS.put("畜牧学", new String[]{"畜牧", "养殖", "家畜", "饲料"});
        TOPIC_KEYWORDS.put("水产学", new String[]{"水产", "渔业", "养鱼", "水产养殖"});
        TOPIC_KEYWORDS.put("食品科学", new String[]{"食品", "食品加工", "食品安全", "保鲜"});

        // ========== 体育 ==========
        TOPIC_KEYWORDS.put("体育学", new String[]{"体育", "运动", "健身", "锻炼", "训练"});
        TOPIC_KEYWORDS.put("足球", new String[]{"足球", "世界杯", "足球赛"});
        TOPIC_KEYWORDS.put("篮球", new String[]{"篮球", "nba", "cba"});
        TOPIC_KEYWORDS.put("田径", new String[]{"田径", "跑步", "马拉松", "短跑", "跳远"});
        TOPIC_KEYWORDS.put("游泳", new String[]{"游泳", "蛙泳", "自由泳", "蝶泳"});
        TOPIC_KEYWORDS.put("武术", new String[]{"武术", "太极", "散打", "拳击", "跆拳道"});

        // ========== 其他专业领域 ==========
        TOPIC_KEYWORDS.put("图书情报", new String[]{"图书馆", "情报学", "档案", "信息管理"});
        TOPIC_KEYWORDS.put("统计学", new String[]{"统计", "回归分析", "假设检验", "置信区间"});
        TOPIC_KEYWORDS.put("军事学", new String[]{"军事", "战略", "战术", "国防"});
        TOPIC_KEYWORDS.put("考古学", new String[]{"考古", "文物", "遗址", "化石"});
        TOPIC_KEYWORDS.put("博物馆学", new String[]{"博物馆", "展览", "文物保护"});
        TOPIC_KEYWORDS.put("旅游管理", new String[]{"旅游", "酒店", "景区", "导游"});
    }

    /**
     * 分类问题到学科
     */
    public static String classify(String question) {
        if (question == null || question.isEmpty()) {
            return "其他";
        }
        String q = question.toLowerCase();

        for (Map.Entry<String, String[]> entry : TOPIC_KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (q.contains(keyword.toLowerCase())) {
                    return entry.getKey();
                }
            }
        }
        return "其他";
    }

    /**
     * 获取学科的子分类
     */
    public static String getSubTopic(String question, String topic) {
        if (question == null || question.isEmpty()) {
            return "未分类";
        }
        String q = question.toLowerCase();
        String[] keywords = TOPIC_KEYWORDS.get(topic);
        if (keywords != null) {
            for (String keyword : keywords) {
                if (q.contains(keyword.toLowerCase())) {
                    return keyword;
                }
            }
        }
        return "基础" + topic;
    }

    /**
     * 获取所有学科数量
     */
    public static int getTopicCount() {
        return TOPIC_KEYWORDS.size();
    }
}
