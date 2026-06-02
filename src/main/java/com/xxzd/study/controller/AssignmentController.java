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
}
