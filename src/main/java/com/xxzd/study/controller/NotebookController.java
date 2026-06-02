package com.xxzd.study.controller;
import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.Notebook;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.NotebookMapper;
import jakarta.annotation.Resource;
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
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody Notebook n, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        Notebook ex = mapper.selectById(id);
        if(ex==null||!ex.getUserId().equals(u.getId())) return ApiResponse.fail("无权操作");
        n.setId(id); mapper.update(n); return ApiResponse.ok("更新成功");
    }
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Long id, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        Notebook ex = mapper.selectById(id);
        if(ex==null||!ex.getUserId().equals(u.getId())) return ApiResponse.fail("无权操作");
        mapper.delete(id); return ApiResponse.ok("删除成功");
    }
    @GetMapping("/{id}")
    public ApiResponse<Notebook> detail(@PathVariable Long id) { return ApiResponse.ok(mapper.selectById(id)); }
    @GetMapping("/my")
    public ApiResponse<List<Notebook>> my(HttpSession session) {
        User u = (User) session.getAttribute("currentUser"); return ApiResponse.ok(mapper.selectByUser(u.getId()));
    }
    @GetMapping("/shared")
    public ApiResponse<List<Notebook>> shared() { return ApiResponse.ok(mapper.selectShared()); }
}
