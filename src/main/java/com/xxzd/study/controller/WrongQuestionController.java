package com.xxzd.study.controller;
import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.User;
import com.xxzd.study.domain.WrongQuestion;
import com.xxzd.study.mapper.WrongQuestionMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/wrong-question")
public class WrongQuestionController {
    @Resource private WrongQuestionMapper mapper;
    @PostMapping
    public ApiResponse<?> create(@RequestBody WrongQuestion q, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        q.setUserId(u.getId()); if(q.getMastery()==null) q.setMastery("unmastered"); if(q.getSource()==null) q.setSource("manual");
        mapper.insert(q); return ApiResponse.ok("添加成功", q);
    }
    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody WrongQuestion q, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        WrongQuestion ex = mapper.selectById(id);
        if(ex==null||!ex.getUserId().equals(u.getId())) return ApiResponse.fail("无权操作");
        q.setId(id); mapper.update(q); return ApiResponse.ok("更新成功");
    }
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Long id, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        WrongQuestion ex = mapper.selectById(id);
        if(ex==null||!ex.getUserId().equals(u.getId())) return ApiResponse.fail("无权操作");
        mapper.delete(id); return ApiResponse.ok("删除成功");
    }
    @GetMapping("/my")
    public ApiResponse<List<WrongQuestion>> my(@RequestParam(required=false) String subject, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        if(subject!=null&&!subject.isEmpty()) return ApiResponse.ok(mapper.selectByUserAndSubject(u.getId(), subject));
        return ApiResponse.ok(mapper.selectByUser(u.getId()));
    }

    @PostMapping("/{id}/mastery")
    public ApiResponse<?> setMastery(@PathVariable Long id, @RequestParam String mastery, HttpSession session) {
        WrongQuestion q = mapper.selectById(id);
        if (q != null) {
            q.setMastery(mastery);
            mapper.update(q);
        }
        return ApiResponse.ok("更新成功");
    }

    @Resource private com.xxzd.study.ai.AiChatService aiChatService;

    @PostMapping("/{id}/ai-analysis")
    public ApiResponse<?> aiAnalysis(@PathVariable Long id, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        WrongQuestion q = mapper.selectById(id);
        if (q == null || !q.getUserId().equals(u.getId())) {
            return ApiResponse.fail("错题不存在或无权操作");
        }

        String prompt = String.format("""
                请作为学科名师和答题诊断专家，对学生的这道错题进行深入剖析：
                【学科科目】：%s
                【关联知识点】：%s
                【题目内容】：
                %s
                【学生的错误答案】：%s
                【正确答案】：%s
                
                请提供包含以下三部分的分析诊断：
                1. 【错因诊断】：学生为什么会答错？（混淆了什么概念/思维盲区/计算或审题疏漏）
                2. 【核心考点与原理解析】：此题考察的本质考点与关键推导步骤
                3. 【巩固与避坑建议】：后续做类似题目时的避坑技巧与复习建议
                
                语言精炼有力，条理分明，字数控制在150-300字内。
                """,
                q.getSubject() != null ? q.getSubject() : "通用学科",
                q.getKnowledgePoint() != null ? q.getKnowledgePoint() : "未指定",
                q.getContent(),
                q.getMyAnswer() != null ? q.getMyAnswer() : "未作答",
                q.getCorrectAnswer() != null ? q.getCorrectAnswer() : "未提供"
        );

        try {
            String analysis = aiChatService.chat("你是一位权威耐心的学科辅导名师，擅长精准定位学生做题错误根因并给出提升方案。", prompt);
            if (analysis != null) {
                analysis = analysis.trim();
                q.setAiAnalysis(analysis);
                mapper.update(q);
                return ApiResponse.ok("AI 错因分析成功", java.util.Map.of("aiAnalysis", analysis));
            }
            return ApiResponse.fail("AI 未能生成分析内容");
        } catch (Exception e) {
            return ApiResponse.fail("AI 分析失败: " + e.getMessage());
        }
    }
}
