package com.xxzd.study.controller;
import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.Post;
import com.xxzd.study.domain.PostReply;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.PostMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/post")
public class PostController {
    @Resource private PostMapper mapper;
    @PostMapping
    public ApiResponse<?> create(@RequestBody Post p, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        p.setUserId(u.getId()); mapper.insertPost(p); return ApiResponse.ok("发布成功", p);
    }
    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody Post p, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        Post ex = mapper.selectById(id);
        if(ex==null||!ex.getUserId().equals(u.getId())) return ApiResponse.fail("无权操作");
        p.setId(id); mapper.updatePost(p); return ApiResponse.ok("更新成功");
    }
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Long id, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        Post ex = mapper.selectById(id);
        if(ex==null||!ex.getUserId().equals(u.getId())) return ApiResponse.fail("无权操作");
        mapper.deletePost(id); return ApiResponse.ok("删除成功");
    }
    @GetMapping
    public ApiResponse<List<Post>> list() { return ApiResponse.ok(mapper.selectAll()); }
    @GetMapping("/{id}")
    public ApiResponse<?> detail(@PathVariable Long id) {
        mapper.incrementView(id); Post p = mapper.selectById(id);
        List<PostReply> replies = mapper.selectReplies(id);
        Map<String,Object> result = new HashMap<>(); result.put("post", p); result.put("replies", replies);
        return ApiResponse.ok(result);
    }
    @PostMapping("/{id}/reply")
    public ApiResponse<?> reply(@PathVariable Long id, @RequestBody PostReply r, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        r.setPostId(id); r.setUserId(u.getId()); if(r.getIsAiGenerated()==null) r.setIsAiGenerated(false);
        mapper.insertReply(r); mapper.incrementReply(id); return ApiResponse.ok("回复成功", r);
    }
}
