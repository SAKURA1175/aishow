package com.xxzd.study.controller;

import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.Assignment;
import com.xxzd.study.domain.AssignmentSubmission;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.AssignmentMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignment")
public class AssignmentController {

    @Resource
    private AssignmentMapper assignmentMapper;

    /** 创建/发布作业（教师） */
    @PostMapping("/create")
    public ApiResponse<?> create(@RequestBody Assignment a, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (!"teacher".equals(user.getRole()) && !"admin".equals(user.getRole())) {
            return ApiResponse.fail("仅教师可发布作业");
        }
        a.setTeacherId(user.getId());
        if (a.getStatus() == null) a.setStatus("published");
        assignmentMapper.insertAssignment(a);
        return ApiResponse.ok("发布成功", a);
    }

    /** 更新作业 */
    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody Assignment a, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        Assignment existing = assignmentMapper.selectById(id);
        if (existing == null || !existing.getTeacherId().equals(user.getId())) {
            return ApiResponse.fail("无权操作");
        }
        a.setId(id);
        assignmentMapper.updateAssignment(a);
        return ApiResponse.ok("更新成功");
    }

    /** 作业详情 */
    @GetMapping("/{id}")
    public ApiResponse<Assignment> detail(@PathVariable Long id) {
        return ApiResponse.ok(assignmentMapper.selectById(id));
    }

    /** 我的作业列表（学生看所在班级的作业，教师看自己发布的） */
    @GetMapping("/my")
    public ApiResponse<List<Assignment>> myAssignments(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if ("teacher".equals(user.getRole()) || "admin".equals(user.getRole())) {
            return ApiResponse.ok(assignmentMapper.selectByTeacherId(user.getId()));
        }
        return ApiResponse.ok(assignmentMapper.selectByStudentId(user.getId()));
    }

    /** 学生提交作业 */
    @PostMapping("/{assignmentId}/submit")
    public ApiResponse<?> submit(@PathVariable Long assignmentId, @RequestBody AssignmentSubmission sub, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        AssignmentSubmission existing = assignmentMapper.selectSubmission(assignmentId, user.getId());
        if (existing != null) {
            existing.setContent(sub.getContent());
            existing.setFileUrl(sub.getFileUrl());
            existing.setStatus("submitted");
            assignmentMapper.updateSubmission(existing);
            return ApiResponse.ok("更新提交成功", existing);
        }
        sub.setAssignmentId(assignmentId);
        sub.setStudentId(user.getId());
        sub.setStatus("submitted");
        assignmentMapper.insertSubmission(sub);
        return ApiResponse.ok("提交成功", sub);
    }

    /** 查看某作业的所有提交（教师） */
    @GetMapping("/{assignmentId}/submissions")
    public ApiResponse<List<AssignmentSubmission>> submissions(@PathVariable Long assignmentId) {
        return ApiResponse.ok(assignmentMapper.selectSubmissionsByAssignment(assignmentId));
    }

    /** 查看我的提交 */
    @GetMapping("/{assignmentId}/my-submission")
    public ApiResponse<AssignmentSubmission> mySubmission(@PathVariable Long assignmentId, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        return ApiResponse.ok(assignmentMapper.selectSubmission(assignmentId, user.getId()));
    }

    /** 教师批改作业 */
    @Resource
    private com.xxzd.study.ai.AiChatService aiChatService;

    @PostMapping("/submissions/{subId}/grade")
    public ApiResponse<?> grade(@PathVariable Long subId, @RequestBody AssignmentSubmission gradeData, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (!"teacher".equals(user.getRole()) && !"admin".equals(user.getRole())) {
            return ApiResponse.fail("仅教师可批改");
        }
        gradeData.setId(subId);
        gradeData.setStatus("graded");
        assignmentMapper.updateSubmission(gradeData);
        return ApiResponse.ok("批改完成");
    }

    /** AI 智能助教辅助批改 */
    @PostMapping("/submissions/{subId}/ai-grade")
    public ApiResponse<?> aiGrade(@PathVariable Long subId, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (!"teacher".equals(user.getRole()) && !"admin".equals(user.getRole())) {
            return ApiResponse.fail("仅教师可操作 AI 批改");
        }
        AssignmentSubmission sub = assignmentMapper.selectSubmissionById(subId);
        if (sub == null) return ApiResponse.fail("提交记录不存在");

        Assignment a = assignmentMapper.selectById(sub.getAssignmentId());
        if (a == null) return ApiResponse.fail("对应作业不存在");

        String prompt = String.format("""
                你是一位严谨且富有教学热情的大学专业课助教。
                请根据以下【作业要求】和【学生提交内容】，进行客观专业的智能预批改。
                
                【作业标题】：%s
                【作业要求与标准】：
                %s
                【作业满分】：%d 分
                
                【学生提交正文】：
                %s
                
                请严格输出标准 JSON（绝不要带有 ```json 等 markdown 标记）：
                {
                  "suggestedScore": 88,
                  "feedback": "具体评价反馈（包括完成度、优点、需完善之处和改进建议，100-200字）"
                }
                """,
                a.getTitle(),
                a.getDescription() != null ? a.getDescription() : "按题意完成",
                a.getMaxScore() != null ? a.getMaxScore() : 100,
                sub.getContent() != null ? sub.getContent() : "（学生未填写文本内容）"
        );

        try {
            String resp = aiChatService.chat("你是一位专业的大学课程智能助教。", prompt);
            if (resp != null) {
                resp = resp.trim();
                if (resp.startsWith("```json")) resp = resp.substring(7);
                if (resp.startsWith("```")) resp = resp.substring(3);
                if (resp.endsWith("```")) resp = resp.substring(0, resp.length() - 3);
                resp = resp.trim();
            }
            com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(resp);
            int suggestedScore = node.path("suggestedScore").asInt(80);
            String feedback = node.path("feedback").asText("完成作业要求，内容清晰。");

            sub.setAiScore(suggestedScore);
            sub.setAiFeedback(feedback);
            assignmentMapper.updateSubmission(sub);

            return ApiResponse.ok("AI 批改完成", java.util.Map.of(
                    "suggestedScore", suggestedScore,
                    "feedback", feedback
            ));
        } catch (Exception e) {
            return ApiResponse.fail("AI 批改失败：" + e.getMessage());
        }
    }
}
