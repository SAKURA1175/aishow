package com.xxzd.study.resume;

import com.fasterxml.jackson.databind.JsonNode;
import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.LearningFlowProgress;
import com.xxzd.study.domain.User;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * 引导式学习流程控制器
 * GET    /api/flow/list                        获取可用流程列表
 * GET    /api/flow/{flowType}/progress         获取用户进度
 * POST   /api/flow/{flowType}/start            开始或重置流程
 * POST   /api/flow/{flowType}/step/{stepId}/submit  SSE 流式提交答案
 * POST   /api/flow/{flowType}/next             进入下一步
 * GET    /api/flow/{flowType}/summary          SSE 流式生成最终报告
 */
@RestController
@RequestMapping("/api/flow")
public class LearningFlowController {

    private static final ExecutorService SSE_EXECUTOR = new ThreadPoolExecutor(
            2, Runtime.getRuntime().availableProcessors() * 2,
            60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100),
            r -> { Thread t = new Thread(r, "flow-sse"); t.setDaemon(true); return t; },
            new ThreadPoolExecutor.CallerRunsPolicy()
    );

    @Resource
    private LearningFlowEngine flowEngine;

    @GetMapping("/list")
    public ApiResponse<List<Map<String, Object>>> list() {
        return ApiResponse.ok(flowEngine.listFlows());
    }

    @GetMapping("/{flowType}/progress")
    public ApiResponse<LearningFlowProgress> progress(@PathVariable String flowType,
                                                       HttpSession session) {
        User user = currentUser(session);
        if (user == null) return ApiResponse.fail("请先登录");
        return ApiResponse.ok(flowEngine.getOrCreateProgress(user.getId(), flowType));
    }

    @PostMapping("/{flowType}/start")
    public ApiResponse<LearningFlowProgress> start(@PathVariable String flowType,
                                                    HttpSession session) {
        User user = currentUser(session);
        if (user == null) return ApiResponse.fail("请先登录");
        return ApiResponse.ok(flowEngine.reset(user.getId(), flowType));
    }

    @PostMapping(value = "/{flowType}/step/{stepId}/submit",
                 produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter submit(@PathVariable String flowType,
                             @PathVariable int stepId,
                             @RequestBody Map<String, String> body,
                             HttpSession session) {
        User user = currentUser(session);
        SseEmitter emitter = new SseEmitter(180_000L);
        String answer = body.getOrDefault("answer", "").trim();

        SSE_EXECUTOR.submit(() -> {
            if (user == null) { safeComplete(emitter, "[ERROR]请先登录"); return; }
            if (answer.isEmpty()) { safeComplete(emitter, "[ERROR]回答不能为空"); return; }

            try {
                flowEngine.submitAndEvaluate(user.getId(), flowType, stepId, answer)
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
            } catch (Exception e) {
                safeComplete(emitter, "[ERROR]" + e.getMessage());
            }
        });

        return emitter;
    }

    @PostMapping("/{flowType}/next")
    public ApiResponse<Object> next(@PathVariable String flowType, HttpSession session) {
        User user = currentUser(session);
        if (user == null) return ApiResponse.fail("请先登录");
        JsonNode nextStep = flowEngine.advance(user.getId(), flowType);
        if (nextStep == null) return ApiResponse.ok(Map.of("completed", true));
        return ApiResponse.ok(nextStep);
    }

    @GetMapping(value = "/{flowType}/summary", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter summary(@PathVariable String flowType, HttpSession session) {
        User user = currentUser(session);
        SseEmitter emitter = new SseEmitter(180_000L);

        SSE_EXECUTOR.submit(() -> {
            if (user == null) { safeComplete(emitter, "[ERROR]请先登录"); return; }

            flowEngine.generateSummary(user.getId(), flowType)
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

    private User currentUser(HttpSession session) {
        Object u = session.getAttribute("currentUser");
        return u instanceof User ? (User) u : null;
    }

    private void safeComplete(SseEmitter emitter, String msg) {
        try { emitter.send(SseEmitter.event().name("error").data(msg)); } catch (Exception ignored) {}
        emitter.complete();
    }
}
