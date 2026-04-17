package com.xxzd.study.ai;

import java.util.List;
import java.util.regex.Pattern;

/**
 * 用户输入安全过滤器
 * 检测常见越狱/提示注入攻击，在调用 AI 之前拦截高风险输入。
 */
public class InputSafetyFilter {

    // ── 越狱关键词黑名单（不区分大小写） ──────────────────────────────────
    private static final List<Pattern> JAILBREAK_PATTERNS = List.of(
        // 忽略指令类
        compile("忽略(以上|之前|前面|所有|上述).*(指令|提示|规则|约束|限制)"),
        compile("ignore (all |previous |prior |above |your )*(instructions?|prompts?|rules?|constraints?)"),
        compile("disregard (all |your |previous )*(instructions?|prompts?|system)"),
        compile("forget (everything|all|your instructions?)"),

        // 身份替换类
        compile("你现在是|you are now|act as|扮演.*(无限制|没有限制|不受限|DAN|GPT)"),
        compile("(pretend|imagine|suppose) (you are|you're|to be) (a|an)? ?(unrestricted|jailbroken|uncensored|evil|DAN)"),
        compile("do anything now|DAN mode|jailbreak|越狱|破解限制"),

        // 提示词泄露类
        compile("(repeat|print|show|output|reveal|tell me) (your |the )?(system prompt|system message|instructions|prompt)"),
        compile("(重复|输出|显示|告诉我|打印).*(系统提示|系统指令|你的提示|提示词)"),

        // 角色扮演绕过类
        compile("(in this (fictional|hypothetical|imaginary) (scenario|world|story|game))"),
        compile("(虚构|假设|想象).*(场景|世界|故事|游戏|角色扮演).*你可以"),
        compile("roleplay|role.play|角色扮演.*(没有|不受|无视|忘记)"),

        // 注入分隔符类
        compile("\\[SYSTEM\\]|\\[INST\\]|<\\|system\\|>|<\\|user\\|>|###\\s*System"),
        compile("---+\\s*(new instruction|system|override|ignore above)"),

        // 有害内容类
        compile("(制作|合成|制造).*(炸弹|毒品|武器|病毒|恶意软件)"),
        compile("(how to|教我|告诉我).*(make|build|create).*(bomb|drug|weapon|malware|exploit)"),
        compile("(色情|pornograph|adult content|nsfw).*(生成|写|画|describe)"),
        compile("(自杀|suicide|kill yourself).*(方法|步骤|how to)")
    );

    private static Pattern compile(String regex) {
        return Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    }

    /**
     * 检测输入是否包含越狱/攻击模式
     *
     * @return 检测结果，包含是否有风险及检测到的原因
     */
    public static CheckResult check(String input) {
        if (input == null || input.trim().isEmpty()) {
            return CheckResult.safe();
        }
        String normalized = input.trim();
        for (Pattern p : JAILBREAK_PATTERNS) {
            if (p.matcher(normalized).find()) {
                return CheckResult.unsafe("检测到不安全的输入模式");
            }
        }
        // 超长输入检测（防止大量注入文本压缩 system prompt 权重）
        if (normalized.length() > 3000) {
            return CheckResult.warn("输入过长，已截断处理");
        }
        return CheckResult.safe();
    }

    /**
     * 截断过长输入
     */
    public static String truncate(String input, int maxLength) {
        if (input == null) return "";
        return input.length() > maxLength ? input.substring(0, maxLength) + "…[内容已截断]" : input;
    }

    // ── 结果封装 ──────────────────────────────────────────────────────────────
    public enum RiskLevel { SAFE, WARN, UNSAFE }

    public static class CheckResult {
        public final RiskLevel level;
        public final String reason;

        private CheckResult(RiskLevel level, String reason) {
            this.level = level;
            this.reason = reason;
        }

        public static CheckResult safe() { return new CheckResult(RiskLevel.SAFE, null); }
        public static CheckResult warn(String reason) { return new CheckResult(RiskLevel.WARN, reason); }
        public static CheckResult unsafe(String reason) { return new CheckResult(RiskLevel.UNSAFE, reason); }

        public boolean isUnsafe() { return level == RiskLevel.UNSAFE; }
        public boolean isWarn() { return level == RiskLevel.WARN; }
    }
}
