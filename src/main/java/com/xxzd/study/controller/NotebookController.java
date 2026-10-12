package com.xxzd.study.controller;
import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.Notebook;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.NotebookMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/notebook")
public class NotebookController {
    @Resource private NotebookMapper mapper;
    @PostMapping
    public ApiResponse<?> create(@RequestBody Notebook n, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        n.setUserId(u.getId()); if(n.getIsShared()==null) n.setIsShared(false);
        mapper.insert(n); return ApiResponse.ok("创建成功", n);
    }
    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody Notebook n, HttpSession session, HttpServletResponse response) {
        User u = (User) session.getAttribute("currentUser");
        Notebook ex = mapper.selectById(id);
        if (ex == null) return ApiResponse.fail("笔记不存在");
        if (!ex.getUserId().equals(u.getId()) && !"admin".equals(u.getRole())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return ApiResponse.fail("无权操作");
        }
        n.setId(id); mapper.update(n); return ApiResponse.ok("更新成功");
    }
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Long id, HttpSession session, HttpServletResponse response) {
        User u = (User) session.getAttribute("currentUser");
        Notebook ex = mapper.selectById(id);
        if (ex == null) return ApiResponse.fail("笔记不存在");
        if (!ex.getUserId().equals(u.getId()) && !"admin".equals(u.getRole())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return ApiResponse.fail("无权操作");
        }
        mapper.delete(id); return ApiResponse.ok("删除成功");
    }
    @GetMapping("/{id}")
    public ApiResponse<Notebook> detail(@PathVariable Long id, HttpSession session, HttpServletResponse response) {
        User u = (User) session.getAttribute("currentUser");
        Notebook n = mapper.selectById(id);
        if (n == null) {
            return ApiResponse.fail("笔记不存在");
        }
        boolean isOwner = u != null && u.getId().equals(n.getUserId());
        boolean isShared = Boolean.TRUE.equals(n.getIsShared());
        boolean isAdmin = u != null && "admin".equals(u.getRole());
        if (!isOwner && !isShared && !isAdmin) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return ApiResponse.fail("无权查看该私密笔记");
        }
        return ApiResponse.ok(n);
    }
    @GetMapping("/my")
    public ApiResponse<List<Notebook>> my(HttpSession session) {
        User u = (User) session.getAttribute("currentUser"); return ApiResponse.ok(mapper.selectByUser(u.getId()));
    }
    @GetMapping("/shared")
    public ApiResponse<List<Notebook>> shared() { return ApiResponse.ok(mapper.selectShared()); }

    @Resource private com.xxzd.study.ai.AiChatService aiChatService;

    @PostMapping("/{id}/ai-summary")
    public ApiResponse<?> aiSummary(@PathVariable Long id, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        Notebook n = mapper.selectById(id);
        if (n == null || !n.getUserId().equals(u.getId())) {
            return ApiResponse.fail("笔记不存在或无权操作");
        }
        if (n.getContent() == null || n.getContent().isBlank()) {
            return ApiResponse.fail("笔记内容为空，无法生成摘要");
        }

        String prompt = String.format("""
                请作为专业学术助教，对以下课堂/学习笔记进行结构化智能摘要与提炼：
                【笔记标题】：%s
                【笔记正文】：
                %s
                
                请提供：
                1. 💡【核心主题与主旨】（1-2句话精炼概括）
                2. 🔑【关键知识要点】（3-5条提纲挈领的 Bullet Points）
                3. 🚀【行动/复习建议】（针对该笔记内容的复习重点或实操指引）
                
                请使用清晰易读的 Markdown 格式输出，语言精练，总字数控制在150-250字内。
                """,
                n.getTitle() != null ? n.getTitle() : "无标题笔记",
                n.getContent()
        );

        try {
            String summary = aiChatService.chat("你是一位高效、专业的知识管理与学术助教专家，擅长提炼精要笔记结构。", prompt);
            if (summary != null) {
                summary = summary.trim();
                n.setAiSummary(summary);
                mapper.update(n);
                return ApiResponse.ok("AI 摘要生成成功", java.util.Map.of("aiSummary", summary));
            }
            return ApiResponse.fail("AI 未能生成摘要内容");
        } catch (Exception e) {
            return ApiResponse.fail("AI 摘要生成失败: " + e.getMessage());
        }
    }
}
