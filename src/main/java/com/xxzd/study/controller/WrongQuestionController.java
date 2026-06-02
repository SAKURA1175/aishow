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
        WrongQuestion q = mapper.selectById(id); q.setMastery(mastery); mapper.update(q); return ApiResponse.ok("更新成功");
    }
}
