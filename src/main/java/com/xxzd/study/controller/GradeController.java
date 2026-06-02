package com.xxzd.study.controller;

import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.Course;
import com.xxzd.study.domain.Grade;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.GradeMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grade")
public class GradeController {

    @Resource
    private GradeMapper gradeMapper;

    // ===== 课程管理 =====

    @PostMapping("/course")
    public ApiResponse<?> createCourse(@RequestBody Course course, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (!"teacher".equals(user.getRole()) && !"admin".equals(user.getRole())) {
            return ApiResponse.fail("仅教师可创建课程");
        }
        course.setTeacherId(user.getId());
        gradeMapper.insertCourse(course);
        return ApiResponse.ok("创建成功", course);
    }

    @GetMapping("/courses")
    public ApiResponse<List<Course>> courses(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        return ApiResponse.ok(gradeMapper.selectCoursesByTeacher(user.getId()));
    }

    // ===== 成绩管理 =====

    @PostMapping("/record")
    public ApiResponse<?> addGrade(@RequestBody Grade grade, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (!"teacher".equals(user.getRole()) && !"admin".equals(user.getRole())) {
            return ApiResponse.fail("仅教师可录入成绩");
        }
        // 自动计算绩点（4.0制）
        if (grade.getScore() != null && grade.getGradePoint() == null) {
            grade.setGradePoint(calculateGradePoint(grade.getScore()));
        }
        gradeMapper.insertGrade(grade);
        return ApiResponse.ok("录入成功", grade);
    }

    @PutMapping("/record/{id}")
    public ApiResponse<?> updateGrade(@PathVariable Long id, @RequestBody Grade grade) {
        grade.setId(id);
        if (grade.getScore() != null && grade.getGradePoint() == null) {
            grade.setGradePoint(calculateGradePoint(grade.getScore()));
        }
        gradeMapper.updateGrade(grade);
        return ApiResponse.ok("更新成功");
    }

    @DeleteMapping("/record/{id}")
    public ApiResponse<?> deleteGrade(@PathVariable Long id) {
        gradeMapper.deleteGrade(id);
        return ApiResponse.ok("删除成功");
    }

    /** 查看我的成绩 */
    @GetMapping("/my")
    public ApiResponse<?> myGrades(@RequestParam(required = false) String semester, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        List<Grade> grades = gradeMapper.selectGradesByUser(user.getId(), semester);
        return ApiResponse.ok(grades);
    }

    /** GPA 统计 */
    @GetMapping("/gpa")
    public ApiResponse<Map<String, Object>> gpa(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        List<Grade> grades = gradeMapper.selectAllGradesForGpa(user.getId());

        BigDecimal totalCredit = BigDecimal.ZERO;
        BigDecimal totalWeighted = BigDecimal.ZERO;
        for (Grade g : grades) {
            if (g.getGradePoint() != null && g.getCourseCredit() != null) {
                totalCredit = totalCredit.add(g.getCourseCredit());
                totalWeighted = totalWeighted.add(g.getGradePoint().multiply(g.getCourseCredit()));
            }
        }
        BigDecimal gpa = totalCredit.compareTo(BigDecimal.ZERO) > 0
                ? totalWeighted.divide(totalCredit, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> result = new HashMap<>();
        result.put("gpa", gpa);
        result.put("totalCredits", totalCredit);
        result.put("courseCount", grades.size());
        result.put("grades", grades);
        return ApiResponse.ok(result);
    }

    /** 某课程成绩（教师查看） */
    @GetMapping("/course/{courseId}")
    public ApiResponse<List<Grade>> courseGrades(@PathVariable Long courseId) {
        return ApiResponse.ok(gradeMapper.selectGradesByCourse(courseId));
    }

    /** 百分制→4.0绩点换算 */
    private BigDecimal calculateGradePoint(BigDecimal score) {
        double s = score.doubleValue();
        if (s >= 90) return new BigDecimal("4.0");
        if (s >= 85) return new BigDecimal("3.7");
        if (s >= 82) return new BigDecimal("3.3");
        if (s >= 78) return new BigDecimal("3.0");
        if (s >= 75) return new BigDecimal("2.7");
        if (s >= 72) return new BigDecimal("2.3");
        if (s >= 68) return new BigDecimal("2.0");
        if (s >= 64) return new BigDecimal("1.5");
        if (s >= 60) return new BigDecimal("1.0");
        return BigDecimal.ZERO;
    }
}
