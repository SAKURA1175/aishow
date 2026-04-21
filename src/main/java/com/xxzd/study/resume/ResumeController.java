package com.xxzd.study.resume;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.Resume;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.ResumeMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.concurrent.*;

/**
 * 简历模块 REST 控制器
 * POST   /api/resume/upload          上传并解析简历
 * GET    /api/resume/list             查询用户简历列表
 * GET    /api/resume/{id}             查询单份简历详情
 * GET    /api/resume/{id}/analyze     SSE 流式分析
 * POST   /api/resume/{id}/ask         SSE 流式追问
 * DELETE /api/resume/{id}             删除简历
 */
@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    /** 共享 SSE 推送线程池 */
    private static final ExecutorService SSE_EXECUTOR = new ThreadPoolExecutor(
            2, Runtime.getRuntime().availableProcessors() * 2,
            60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100),
            r -> { Thread t = new Thread(r, "resume-sse"); t.setDaemon(true); return t; },
            new ThreadPoolExecutor.CallerRunsPolicy()
    );

    @Resource
    private ResumeParseService parseService;

    @Resource
    private ResumeAnalyzeService analyzeService;

    @Resource
    private ResumeMapper resumeMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── 上传简历 ──────────────────────────────────────────────────────────────

    @PostMapping("/upload")
    public ApiResponse<Resume> upload(@RequestParam("file") MultipartFile file,
                                      HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return ApiResponse.fail("请先登录");
        if (file.isEmpty()) return ApiResponse.fail("文件不能为空");

        long maxSize = 10 * 1024 * 1024L; // 10MB
        if (file.getSize() > maxSize) return ApiResponse.fail("文件不能超过 10MB");

        try {
            String filename = file.getOriginalFilename();
            String fileType = parseService.detectFileType(filename);
            String rawText  = parseService.extractText(file);

            if (rawText.isBlank()) return ApiResponse.fail("未能从文件中提取到文本，请检查文件内容");

            Resume resume = new Resume();
            resume.setUserId(user.getId());
            resume.setFilename(filename);
            resume.setFileType(fileType);
            resume.setRawText(rawText);
            resumeMapper.insert(resume);

            // 异步做结构化抽取（不阻塞响应）
            Long resumeId = resume.getId();
            String textForExtract = rawText;
            SSE_EXECUTOR.submit(() -> {
                try {
                    String structured = analyzeService.structuredExtract(textForExtract);
                    resumeMapper.updateAnalysis(resumeId, structured, null, null);
                } catch (Exception e) {
                    System.err.println("[Resume] 结构化抽取失败: " + e.getMessage());
                }
            });

            return ApiResponse.ok(resume);
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.fail("文件解析失败：" + e.getMessage());
        }
    }

    // ── 列表 & 详情 ───────────────────────────────────────────────────────────

    @GetMapping("/list")
    public ApiResponse<List<Resume>> list(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return ApiResponse.fail("请先登录");
        return ApiResponse.ok(resumeMapper.selectByUserId(user.getId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<Resume> detail(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return ApiResponse.fail("请先登录");
        Resume resume = resumeMapper.selectById(id);
        if (resume == null || !resume.getUserId().equals(user.getId()))
            return ApiResponse.fail("简历不存在或无权访问");
        return ApiResponse.ok(resume);
    }

    // ── SSE 分析 ──────────────────────────────────────────────────────────────

    @GetMapping(value = "/{id}/analyze", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter analyze(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        SseEmitter emitter = new SseEmitter(180_000L);

        SSE_EXECUTOR.submit(() -> {
            if (user == null) {
                safeComplete(emitter, "[ERROR]请先登录");
                return;
            }
            Resume resume = resumeMapper.selectById(id);
            if (resume == null || !resume.getUserId().equals(user.getId())) {
                safeComplete(emitter, "[ERROR]简历不存在或无权访问");
                return;
            }

            StringBuilder fullAnalysis = new StringBuilder();
            Flux<String> flux = analyzeService.streamAnalyze(
                    resume.getRawText(),
                    resume.getStructuredJson());

            flux.doOnNext(token -> {
                try {
                    emitter.send(SseEmitter.event().name("data").data(token));
                    fullAnalysis.append(token);
                } catch (Exception ignored) {}
            }).doOnComplete(() -> {
                // 保存分析结果
                analyzeService.saveAnalysis(id, resume.getStructuredJson(), fullAnalysis.toString());
                try { emitter.send(SseEmitter.event().name("done").data("[DONE]")); } catch (Exception ignored) {}
                emitter.complete();
            }).doOnError(e -> {
                safeComplete(emitter, "[ERROR]" + e.getMessage());
            }).subscribe();
        });

        return emitter;
    }

    // ── SSE 追问 ──────────────────────────────────────────────────────────────

    @PostMapping(value = "/{id}/ask", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter ask(@PathVariable Long id,
                          @RequestBody java.util.Map<String, String> body,
                          HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        SseEmitter emitter = new SseEmitter(180_000L);
        String question = body.getOrDefault("question", "").trim();

        SSE_EXECUTOR.submit(() -> {
            if (user == null) { safeComplete(emitter, "[ERROR]请先登录"); return; }
            if (question.isEmpty()) { safeComplete(emitter, "[ERROR]问题不能为空"); return; }

            Resume resume = resumeMapper.selectById(id);
            if (resume == null || !resume.getUserId().equals(user.getId())) {
                safeComplete(emitter, "[ERROR]简历不存在或无权访问");
                return;
            }

            analyzeService.streamAsk(resume.getRawText(), question)
                    .doOnNext(token -> {
                        try { emitter.send(SseEmitter.event().name("data").data(token)); }
                        catch (Exception ignored) {}
                    })
                    .doOnComplete(() -> {
                        try { emitter.send(SseEmitter.event().name("done").data("[DONE]")); }
                        catch (Exception ignored) {}
                        emitter.complete();
                    })
                    .doOnError(e -> safeComplete(emitter, "[ERROR]" + e.getMessage()))
                    .subscribe();
        });

        return emitter;
    }

    // ── 删除 ──────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return ApiResponse.fail("请先登录");
        Resume resume = resumeMapper.selectById(id);
        if (resume == null || !resume.getUserId().equals(user.getId()))
            return ApiResponse.fail("简历不存在或无权访问");
        resumeMapper.deleteById(id);
        return ApiResponse.ok(null);
    }

    // ── 工具 ──────────────────────────────────────────────────────────────────

    private void safeComplete(SseEmitter emitter, String errorMsg) {
        try {
            emitter.send(SseEmitter.event().name("error").data(errorMsg));
        } catch (Exception ignored) {}
        emitter.complete();
    }

    // ── 简历知识库导入（供爬虫 / 管理员调用）────────────────────────────────

    @Resource
    private ResumeKbService resumeKbService;

    /**
     * POST /api/resume/kb/import
     * Body: { "id": "unique_id", "title": "文档标题", "content": "正文内容" }
     * 需要 teacher 或 admin 角色
     */
    @PostMapping("/kb/import")
    public ApiResponse<String> kbImport(@RequestBody java.util.Map<String, String> body,
                                         HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return ApiResponse.fail("请先登录");
        String role = user.getRole();
        if (!"admin".equals(role) && !"teacher".equals(role)) return ApiResponse.fail("无权限");

        String id      = body.get("id");
        String title   = body.getOrDefault("title", "");
        String content = body.getOrDefault("content", "");
        if (id == null || id.isBlank())      return ApiResponse.fail("id 不能为空");
        if (content.isBlank())               return ApiResponse.fail("content 不能为空");

        resumeKbService.indexKnowledgeEntry(id, title, content);
        return ApiResponse.ok("已写入: " + id);
    }
}
