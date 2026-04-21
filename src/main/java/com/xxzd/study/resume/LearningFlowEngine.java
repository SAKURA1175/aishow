package com.xxzd.study.resume;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.xxzd.study.ai.AiChatService;
import com.xxzd.study.domain.LearningFlowProgress;
import com.xxzd.study.mapper.LearningFlowProgressMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.Resource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 引导式学习流程引擎
 * - 从 classpath:flows/*.json 加载流程定义
 * - 管理用户进度（MySQL 持久化）
 * - SSE 流式 AI 评估
 */
@Service
public class LearningFlowEngine {

    private final Map<String, JsonNode> flowDefinitions = new HashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Resource
    private LearningFlowProgressMapper progressMapper;

    @Resource
    private AiChatService aiChatService;

    // ── 初始化：加载所有流程定义 ──────────────────────────────────────────────

    @PostConstruct
    public void loadFlows() {
        loadFlow("resume_basics");
    }

    private void loadFlow(String flowType) {
        try {
            ClassPathResource resource = new ClassPathResource("flows/" + flowType + ".json");
            try (InputStream is = resource.getInputStream()) {
                JsonNode node = objectMapper.readTree(is);
                flowDefinitions.put(flowType, node);
                System.out.println("[LearningFlow] 已加载流程: " + flowType);
            }
        } catch (Exception e) {
            System.err.println("[LearningFlow] 加载流程失败: " + flowType + " - " + e.getMessage());
        }
    }

    // ── 公开 API ──────────────────────────────────────────────────────────────

    /** 获取可用流程列表（元数据） */
    public List<Map<String, Object>> listFlows() {
        return flowDefinitions.entrySet().stream().map(entry -> {
            JsonNode def = entry.getValue();
            Map<String, Object> meta = new HashMap<>();
            meta.put("flowType", entry.getKey());
            meta.put("title", def.path("title").asText());
            meta.put("description", def.path("description").asText());
            meta.put("totalSteps", def.path("totalSteps").asInt());
            return meta;
        }).toList();
    }

    /** 获取或创建用户的流程进度 */
    public LearningFlowProgress getOrCreateProgress(Long userId, String flowType) {
        LearningFlowProgress progress = progressMapper.selectByUserAndFlow(userId, flowType);
        if (progress != null) return progress;

        JsonNode def = requireFlow(flowType);
        progress = new LearningFlowProgress();
        progress.setUserId(userId);
        progress.setFlowType(flowType);
        progress.setCurrentStep(1);
        progress.setTotalSteps(def.path("totalSteps").asInt());
        progress.setStepData("{}");
        progress.setStatus("in_progress");
        progressMapper.insert(progress);
        return progress;
    }

    /** 获取当前步骤定义 */
    public JsonNode getCurrentStepDef(String flowType, int stepId) {
        JsonNode def = requireFlow(flowType);
        for (JsonNode step : def.path("steps")) {
            if (step.path("id").asInt() == stepId) return step;
        }
        return null;
    }

    /**
     * 提交当前步骤答案，SSE 流式返回 AI 评估
     * 同时持久化用户答案到 stepData
     */
    public Flux<String> submitAndEvaluate(Long userId, String flowType, int stepId, String answer) {
        LearningFlowProgress progress = progressMapper.selectByUserAndFlow(userId, flowType);
        if (progress == null) return Flux.error(new IllegalStateException("未找到学习进度，请先开始流程"));

        JsonNode stepDef = getCurrentStepDef(flowType, stepId);
        if (stepDef == null) return Flux.error(new IllegalArgumentException("无效的步骤 ID: " + stepId));

        // 持久化用户答案
        ObjectNode stepData = parseStepData(progress.getStepData());
        stepData.put("step" + stepId, answer);
        progressMapper.updateProgress(progress.getId(), stepId, stepData.toString(), "in_progress");

        // 构建评估 Prompt
        String evalPrompt = buildEvalPrompt(stepDef, stepData, answer);

        String systemPrompt = """
                你是一位亲切的简历写作导师，语气温和鼓励。
                请基于用户的回答给出简短、具体的反馈（不超过150字）。
                用 Markdown 格式输出，重点用粗体标出。
                """;

        return aiChatService.streamChat(systemPrompt, List.of(), evalPrompt);
    }

    /**
     * 进入下一步（返回下一步定义，若已是最后一步返回 null）
     */
    public JsonNode advance(Long userId, String flowType) {
        LearningFlowProgress progress = progressMapper.selectByUserAndFlow(userId, flowType);
        if (progress == null) return null;

        int nextStep = progress.getCurrentStep() + 1;
        boolean completed = nextStep > progress.getTotalSteps();
        String status = completed ? "completed" : "in_progress";

        progressMapper.updateProgress(progress.getId(), nextStep,
                progress.getStepData(), status);

        if (completed) return null;
        return getCurrentStepDef(flowType, nextStep);
    }

    /**
     * 重置进度（重新开始）
     */
    public LearningFlowProgress reset(Long userId, String flowType) {
        LearningFlowProgress progress = progressMapper.selectByUserAndFlow(userId, flowType);
        if (progress != null) {
            progressMapper.updateProgress(progress.getId(), 1, "{}", "in_progress");
            progress.setCurrentStep(1);
            progress.setStepData("{}");
            progress.setStatus("in_progress");
        } else {
            progress = getOrCreateProgress(userId, flowType);
        }
        return progress;
    }

    /**
     * 流式生成最终总结报告（最后一步专用）
     */
    public Flux<String> generateSummary(Long userId, String flowType) {
        LearningFlowProgress progress = progressMapper.selectByUserAndFlow(userId, flowType);
        if (progress == null) return Flux.error(new IllegalStateException("未找到学习进度"));

        JsonNode stepDef = getCurrentStepDef(flowType, progress.getTotalSteps());
        if (stepDef == null) return Flux.error(new IllegalStateException("未找到最终步骤定义"));

        ObjectNode stepData = parseStepData(progress.getStepData());
        String evalPrompt = buildEvalPrompt(stepDef, stepData, "");

        String systemPrompt = """
                你是一位专业的简历顾问，请生成一份完整、详细的简历优化建议报告。
                使用 Markdown 格式，包含表格、分节标题。
                语气专业，给出可落地的具体建议。
                """;

        return aiChatService.streamChat(systemPrompt, List.of(), evalPrompt);
    }

    // ── 工具方法 ──────────────────────────────────────────────────────────────

    private JsonNode requireFlow(String flowType) {
        JsonNode def = flowDefinitions.get(flowType);
        if (def == null) throw new IllegalArgumentException("未知的流程类型: " + flowType);
        return def;
    }

    private ObjectNode parseStepData(String json) {
        try {
            JsonNode node = objectMapper.readTree(json == null ? "{}" : json);
            return node instanceof ObjectNode ? (ObjectNode) node : objectMapper.createObjectNode();
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }

    private String buildEvalPrompt(JsonNode stepDef, ObjectNode stepData, String currentAnswer) {
        StringBuilder sb = new StringBuilder(stepDef.path("evalPrompt").asText(""));
        // 替换当前答案
        replaceInBuilder(sb, "{answer}", currentAnswer);
        // 替换 step1-5
        for (int i = 1; i <= 5; i++) {
            String key = "step" + i;
            replaceInBuilder(sb, "{" + key + "}", stepData.path(key).asText("（未填写）"));
        }
        return sb.toString();
    }

    private void replaceInBuilder(StringBuilder sb, String target, String replacement) {
        int idx;
        while ((idx = sb.indexOf(target)) != -1) {
            sb.replace(idx, idx + target.length(), replacement == null ? "" : replacement);
        }
    }
}

