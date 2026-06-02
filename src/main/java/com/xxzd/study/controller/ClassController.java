package com.xxzd.study.controller;

import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.ClassMember;
import com.xxzd.study.domain.StudyClass;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.ClassMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/class")
public class ClassController {

    @Resource
    private ClassMapper classMapper;

    /** 创建班级（教师/管理员） */
    @PostMapping("/create")
    public ApiResponse<?> create(@RequestBody StudyClass sc, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (!"teacher".equals(user.getRole()) && !"admin".equals(user.getRole())) {
            return ApiResponse.fail("仅教师可创建班级");
        }
        sc.setTeacherId(user.getId());
        sc.setInviteCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        sc.setStatus("active");
        classMapper.insertClass(sc);
        return ApiResponse.ok("创建成功", sc);
    }

    /** 通过邀请码加入班级 */
    @PostMapping("/join")
    public ApiResponse<?> join(@RequestParam String inviteCode, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        StudyClass sc = classMapper.selectByInviteCode(inviteCode);
        if (sc == null) return ApiResponse.fail("邀请码无效");
        if (classMapper.selectMember(sc.getId(), user.getId()) != null) {
            return ApiResponse.fail("已在该班级中");
        }
        ClassMember m = new ClassMember();
        m.setClassId(sc.getId());
        m.setUserId(user.getId());
        m.setRole("student");
        classMapper.insertMember(m);
        return ApiResponse.ok("加入成功", sc);
    }

    /** 我的班级列表 */
    @GetMapping("/my")
    public ApiResponse<List<StudyClass>> myClasses(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        List<StudyClass> list;
        if ("teacher".equals(user.getRole()) || "admin".equals(user.getRole())) {
            list = classMapper.selectByTeacherId(user.getId());
        } else {
            list = classMapper.selectByUserId(user.getId());
        }
        return ApiResponse.ok(list);
    }

    /** 班级详情 */
    @GetMapping("/{id}")
    public ApiResponse<StudyClass> detail(@PathVariable Long id) {
        return ApiResponse.ok(classMapper.selectById(id));
    }

    /** 班级成员列表 */
    @GetMapping("/{id}/members")
    public ApiResponse<List<ClassMember>> members(@PathVariable Long id) {
        return ApiResponse.ok(classMapper.selectMembersByClassId(id));
    }

    /** 移除成员（教师） */
    @DeleteMapping("/{classId}/members/{userId}")
    public ApiResponse<?> removeMember(@PathVariable Long classId, @PathVariable Long userId, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        StudyClass sc = classMapper.selectById(classId);
        if (sc == null || !sc.getTeacherId().equals(user.getId())) {
            return ApiResponse.fail("无权操作");
        }
        classMapper.deleteMember(classId, userId);
        return ApiResponse.ok("已移除");
    }

    /** 更新班级信息 */
    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody StudyClass sc, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        StudyClass existing = classMapper.selectById(id);
        if (existing == null || !existing.getTeacherId().equals(user.getId())) {
            return ApiResponse.fail("无权操作");
        }
        sc.setId(id);
        classMapper.updateClass(sc);
        return ApiResponse.ok("更新成功");
    }
}
