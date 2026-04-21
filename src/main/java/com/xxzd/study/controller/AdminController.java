package com.xxzd.study.controller;

import com.xxzd.study.ai.EmbeddingService;
import com.xxzd.study.ai.SystemPromptProvider;
import com.xxzd.study.ai.VectorRagService;
import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.config.properties.AiProperties;
import com.xxzd.study.domain.Document;
import com.xxzd.study.domain.DocumentChunk;
import com.xxzd.study.domain.DocumentEmbedding;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.DocumentChunkMapper;
import com.xxzd.study.mapper.DocumentEmbeddingMapper;
import com.xxzd.study.service.DocumentService;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 管理员控制台接口
 * - 模型配置热更新（云模型 / 本地模型）
 * - 批量资料导入（触发向量化进入 Chroma）
 * - 向量化任务状态查询
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Resource
    private AiProperties aiProperties;

    @Resource
    private DocumentService documentService;

    @Resource
    private EmbeddingService embeddingService;

    @Resource
    private VectorRagService vectorRagService;

    @Resource
    private DocumentChunkMapper documentChunkMapper;

    @Resource
    private DocumentEmbeddingMapper documentEmbeddingMapper;

    @Resource
    private SystemPromptProvider systemPromptProvider;

    /** 简单的内存任务状态 Map（进程内共享，生产建议换 Redis） */
    private static final ConcurrentHashMap<String, VectorizeTask> TASK_MAP = new ConcurrentHashMap<>();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. 获取当前模型配置
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/model/config")
    public ApiResponse<ModelConfig> getModelConfig(HttpSession session) {
        if (!isAdmin(session)) return ApiResponse.fail("无权限");
        ModelConfig cfg = new ModelConfig();
        cfg.setModel(aiProperties.getModel());
        cfg.setApiUrl(aiProperties.getApi().getUrl());
        // 出于安全，key 脱敏返回
        String key = aiProperties.getApi().getKey();
        cfg.setApiKey(key != null && key.length() > 8
                ? key.substring(0, 4) + "****" + key.substring(key.length() - 4)
                : "****");
        return ApiResponse.ok(cfg);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. 热更新模型配置（写 Redis + 刷新 AiProperties Bean）
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/model/config")
    public ApiResponse<Void> updateModelConfig(@RequestBody ModelConfig config, HttpSession session) {
        if (!isAdmin(session)) return ApiResponse.fail("无权限");

        if (config.getModel() == null || config.getModel().isBlank()) {
            return ApiResponse.fail("模型名称不能为空");
        }
        if (config.getApiUrl() == null || config.getApiUrl().isBlank()) {
            return ApiResponse.fail("API 地址不能为空");
        }
        if (config.getApiKey() == null || config.getApiKey().isBlank()) {
            return ApiResponse.fail("API Key 不能为空");
        }

        // 写入 Redis（redis.properties 的字段名，供下次重启使用）
        stringRedisTemplate.opsForValue().set("ai.model", config.getModel());
        stringRedisTemplate.opsForValue().set("ai.api.url", config.getApiUrl());
        stringRedisTemplate.opsForValue().set("ai.api.key", config.getApiKey());

        // 热更新内存中的 AiProperties（立即生效，不需要重启）
        aiProperties.setModel(config.getModel());
        aiProperties.getApi().setUrl(config.getApiUrl());
        // 如果前端传来的是脱敏值则不更新 key
        if (!config.getApiKey().contains("****")) {
            aiProperties.getApi().setKey(config.getApiKey());
        }

        return ApiResponse.ok("模型配置已更新，立即生效", null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. 常用预设模型列表（前端下拉菜单用）
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/model/presets")
    public ApiResponse<List<ModelPreset>> getModelPresets(HttpSession session) {
        if (!isAdmin(session)) return ApiResponse.fail("无权限");
        List<ModelPreset> presets = new ArrayList<>();

        // 本地模型（Ollama / LM Studio）
        presets.add(new ModelPreset("local-lmstudio", "LM Studio (本地)", "http://localhost:1234", "本地", "lm-studio"));
        presets.add(new ModelPreset("local-ollama", "Ollama (本地)", "http://localhost:11434", "本地", "ollama"));

        // 主流云模型 OpenAI 兼容协议
        presets.add(new ModelPreset("openai-gpt4o", "GPT-4o", "https://api.openai.com/v1", "云端 · OpenAI", "sk-..."));
        presets.add(new ModelPreset("deepseek-v3", "DeepSeek V3", "https://api.deepseek.com/v1", "云端 · DeepSeek", "sk-..."));
        presets.add(new ModelPreset("qwen-turbo", "Qwen-Turbo (通义千问)", "https://dashscope.aliyuncs.com/compatible-mode/v1", "云端 · 阿里", "sk-..."));
        presets.add(new ModelPreset("glm4-plus", "GLM-4-Plus (智谱)", "https://open.bigmodel.cn/api/paas/v4", "云端 · 智谱", "..."));
        presets.add(new ModelPreset("gemini-2.5-pro", "Gemini 2.5 Pro (中转)", "https://new.lemonapi.site/v1", "云端 · Google", "sk-..."));
        presets.add(new ModelPreset("moonshot-v1", "Kimi (月之暗面)", "https://api.moonshot.cn/v1", "云端 · 月之暗面", "sk-..."));

        return ApiResponse.ok(presets);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. 批量文件导入（上传多文件 → 异步向量化）
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/knowledge/import")
    public ApiResponse<BatchImportResult> batchImport(
            @RequestParam("files") MultipartFile[] files,
            HttpSession session) throws IOException {

        if (!isAdmin(session)) return ApiResponse.fail("无权限");
        if (files == null || files.length == 0) return ApiResponse.fail("请选择至少一个文件");

        User user = (User) session.getAttribute("currentUser");
        String taskId = "batch-" + System.currentTimeMillis();

        // ★ 关键修复：在请求线程里把所有文件字节读入内存
        // Tomcat 在请求结束后会清理临时文件，后台线程无法再访问 MultipartFile
        record FileEntry(String name, byte[] bytes) {}
        List<FileEntry> entries = new ArrayList<>();
        for (MultipartFile f : files) {
            String name = f.getOriginalFilename();
            if (name == null || name.isBlank()) name = "unnamed";
            entries.add(new FileEntry(name, f.getBytes()));
        }

        // 初始化任务状态
        VectorizeTask task = new VectorizeTask();
        task.setTaskId(taskId);
        task.setTotal(entries.size());
        task.setDone(0);
        task.setFailed(0);
        task.setStatus("running");
        TASK_MAP.put(taskId, task);

        // 后台异步处理
        final User finalUser = user;
        Thread t = new Thread(() -> {
            int done = 0, failed = 0;
            for (FileEntry entry : entries) {
                try {
                    String originalFilename = entry.name();
                    byte[] fileBytes = entry.bytes();

                    // 保存数据库记录
                    Document doc = documentService.saveDocument(originalFilename, finalUser);

                    // 本地存储
                    String baseDir = System.getProperty("user.home") + java.io.File.separator + "study-ai-uploads";
                    java.nio.file.Path dir = java.nio.file.Paths.get(baseDir);
                    java.nio.file.Files.createDirectories(dir);
                    String storedName = doc.getId() + "_" + originalFilename;
                    java.nio.file.Path dest = dir.resolve(storedName);
                    java.nio.file.Files.write(dest, fileBytes);
                    documentService.updateStoredFilename(doc.getId(), storedName);

                    // 切片入库（用字节数组构建输入流，可重复读）
                    try (java.io.InputStream is = new java.io.ByteArrayInputStream(fileBytes)) {
                        documentService.rebuildChunks(doc.getId(), is, originalFilename);
                    }

                    // 向量化（同步，因为是后台线程）
                    List<DocumentChunk> chunks = documentChunkMapper.selectByDocumentId(doc.getId());
                    int chunkOk = 0;
                    for (DocumentChunk chunk : chunks) {
                        try {
                            float[] vec = embeddingService.embed(chunk.getContent());
                            vectorRagService.indexChunk(chunk, vec);
                            DocumentEmbedding emb = new DocumentEmbedding();
                            emb.setChunkId(chunk.getId());
                            emb.setVectorJson(EmbeddingService.toJson(vec));
                            documentEmbeddingMapper.deleteByChunkId(chunk.getId());
                            documentEmbeddingMapper.insert(emb);
                            chunkOk++;
                        } catch (Exception e) {
                            System.err.println("[BatchImport] chunk " + chunk.getId() + " 向量化失败: " + e.getMessage());
                        }
                    }
                    System.out.println("[BatchImport] ✅ " + originalFilename + " 处理完成，向量化 " + chunkOk + "/" + chunks.size() + " 个切片");

                    done++;
                    task.setDone(done);
                    task.setLastFile(originalFilename);
                } catch (Exception e) {
                    failed++;
                    task.setFailed(failed);
                    System.err.println("[BatchImport] ❌ 文件处理失败: " + entry.name() + " -> " + e.getMessage());
                }
            }
            task.setStatus(failed == 0 ? "done" : "partial");
            System.out.println("[BatchImport] 任务完成: done=" + task.getDone() + " failed=" + task.getFailed());
        }, "batch-import-" + taskId);
        t.setDaemon(true);
        t.start();

        BatchImportResult result = new BatchImportResult();
        result.setTaskId(taskId);
        result.setTotal(entries.size());
        return ApiResponse.ok("批量导入任务已启动，正在后台处理", result);
    }





    // ─────────────────────────────────────────────────────────────────────────
    // 5. 查询向量化任务进度
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/knowledge/task/{taskId}")
    public ApiResponse<VectorizeTask> getTaskStatus(@PathVariable String taskId, HttpSession session) {
        if (!isAdmin(session)) return ApiResponse.fail("无权限");
        VectorizeTask task = TASK_MAP.get(taskId);
        if (task == null) return ApiResponse.fail("任务不存在");
        return ApiResponse.ok(task);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. 对话上下文配置（历史长度）
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/chat/config")
    public ApiResponse<ChatConfig> getChatConfig(HttpSession session) {
        if (!isAdmin(session)) return ApiResponse.fail("无权限");
        ChatConfig cfg = new ChatConfig();
        AiProperties.Rag rag = aiProperties.getRag();
        cfg.setMaxHistoryMessages(rag != null ? rag.getMaxHistoryMessages() : 30);
        cfg.setMaxHistoryChars(rag != null ? rag.getMaxHistoryChars() : 12000);
        return ApiResponse.ok(cfg);
    }

    @PostMapping("/chat/config")
    public ApiResponse<Void> updateChatConfig(@RequestBody ChatConfig config, HttpSession session) {
        if (!isAdmin(session)) return ApiResponse.fail("无权限");
        if (config.getMaxHistoryMessages() < 2 || config.getMaxHistoryMessages() > 100) {
            return ApiResponse.fail("历史消息条数需在 2~100 之间");
        }
        if (config.getMaxHistoryChars() < 500 || config.getMaxHistoryChars() > 100000) {
            return ApiResponse.fail("历史字符数需在 500~100000 之间");
        }
        // 热更新内存中的 AiProperties（立即生效）
        if (aiProperties.getRag() == null) {
            aiProperties.setRag(new AiProperties.Rag());
        }
        aiProperties.getRag().setMaxHistoryMessages(config.getMaxHistoryMessages());
        aiProperties.getRag().setMaxHistoryChars(config.getMaxHistoryChars());
        // 同时写 Redis，供下次重启恢复
        stringRedisTemplate.opsForValue().set("ai.rag.max-history-messages", String.valueOf(config.getMaxHistoryMessages()));
        stringRedisTemplate.opsForValue().set("ai.rag.max-history-chars", String.valueOf(config.getMaxHistoryChars()));
        return ApiResponse.ok("对话上下文配置已更新，立即生效", null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. 系统提示词管理
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/prompt/{role}")
    public ApiResponse<PromptConfig> getPrompt(@PathVariable String role, HttpSession session) {
        if (!isAdmin(session)) return ApiResponse.fail("无权限");
        PromptConfig cfg = new PromptConfig();
        cfg.setRole(role);
        cfg.setContent(systemPromptProvider.getPromptRaw(role));
        return ApiResponse.ok(cfg);
    }

    @PostMapping("/prompt/{role}")
    public ApiResponse<Void> updatePrompt(@PathVariable String role, @RequestBody PromptConfig cfg, HttpSession session) {
        if (!isAdmin(session)) return ApiResponse.fail("无权限");
        if (cfg.getContent() == null || cfg.getContent().isBlank()) {
            return ApiResponse.fail("提示词内容不能为空");
        }
        systemPromptProvider.setPrompt(role, cfg.getContent());
        // 持久化到 Redis，下次重启后读取并覆盖（在 SystemPromptProvider 初始化时读取）
        stringRedisTemplate.opsForValue().set("ai.system-prompt." + role, cfg.getContent());
        return ApiResponse.ok("系统提示词已更新，立即生效", null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 工具方法
    // ─────────────────────────────────────────────────────────────────────────

    private boolean isAdmin(HttpSession session) {
        Object obj = session.getAttribute("currentUser");
        if (!(obj instanceof User u)) return false;
        return "admin".equals(u.getRole()) || "teacher".equals(u.getRole());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTO
    // ─────────────────────────────────────────────────────────────────────────

    public static class ModelConfig {
        private String model;
        private String apiUrl;
        private String apiKey;

        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public String getApiUrl() { return apiUrl; }
        public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }
        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    }

    public static class ModelPreset {
        private final String id;
        private final String name;
        private final String apiUrl;
        private final String category;
        private final String apiKeyHint;

        public ModelPreset(String id, String name, String apiUrl, String category, String apiKeyHint) {
            this.id = id;
            this.name = name;
            this.apiUrl = apiUrl;
            this.category = category;
            this.apiKeyHint = apiKeyHint;
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getApiUrl() { return apiUrl; }
        public String getCategory() { return category; }
        public String getApiKeyHint() { return apiKeyHint; }
    }

    public static class BatchImportResult {
        private String taskId;
        private int total;

        public String getTaskId() { return taskId; }
        public void setTaskId(String taskId) { this.taskId = taskId; }
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
    }

    public static class VectorizeTask {
        private String taskId;
        private int total;
        private int done;
        private int failed;
        private String status; // running / done / partial
        private String lastFile;

        public String getTaskId() { return taskId; }
        public void setTaskId(String taskId) { this.taskId = taskId; }
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
        public int getDone() { return done; }
        public void setDone(int done) { this.done = done; }
        public int getFailed() { return failed; }
        public void setFailed(int failed) { this.failed = failed; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getLastFile() { return lastFile; }
        public void setLastFile(String lastFile) { this.lastFile = lastFile; }
    }

    public static class ChatConfig {
        private int maxHistoryMessages;
        private int maxHistoryChars;

        public int getMaxHistoryMessages() { return maxHistoryMessages; }
        public void setMaxHistoryMessages(int maxHistoryMessages) { this.maxHistoryMessages = maxHistoryMessages; }
        public int getMaxHistoryChars() { return maxHistoryChars; }
        public void setMaxHistoryChars(int maxHistoryChars) { this.maxHistoryChars = maxHistoryChars; }
    }

    public static class PromptConfig {
        private String role;
        private String content;

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
