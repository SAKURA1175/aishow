package com.xxzd.study.controller;

import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.ScheduleEvent;
import com.xxzd.study.domain.Todo;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.TodoMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/todo")
public class TodoController {

    @Resource
    private TodoMapper todoMapper;

    // ===== 待办 =====

    @PostMapping
    public ApiResponse<?> createTodo(@RequestBody Todo todo, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        todo.setUserId(user.getId());
        if (todo.getStatus() == null) todo.setStatus("pending");
        if (todo.getSourceType() == null) todo.setSourceType("manual");
        todoMapper.insertTodo(todo);
        return ApiResponse.ok("创建成功", todo);
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateTodo(@PathVariable Long id, @RequestBody Todo todo, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        Todo existing = todoMapper.selectTodoById(id);
        if (existing == null || !existing.getUserId().equals(user.getId())) {
            return ApiResponse.fail("无权操作");
        }
        todo.setId(id);
        todo.setUserId(user.getId());
        todoMapper.updateTodo(todo);
        return ApiResponse.ok("更新成功");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteTodo(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        Todo existing = todoMapper.selectTodoById(id);
        if (existing == null || !existing.getUserId().equals(user.getId())) {
            return ApiResponse.fail("无权操作");
        }
        todoMapper.deleteTodo(id);
        return ApiResponse.ok("删除成功");
    }

    /** 完成/取消完成待办 */
    @PostMapping("/{id}/toggle")
    public ApiResponse<?> toggle(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        Todo t = todoMapper.selectTodoById(id);
        if (t == null || !t.getUserId().equals(user.getId())) {
            return ApiResponse.fail("无权操作");
        }
        t.setStatus("done".equals(t.getStatus()) ? "pending" : "done");
        todoMapper.updateTodo(t);
        return ApiResponse.ok(t.getStatus());
    }

    /** 我的待办列表 */
    @GetMapping("/list")
    public ApiResponse<?> list(@RequestParam(required = false) String status, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        List<Todo> todos = todoMapper.selectTodosByUser(user.getId(), status);
        int pendingCount = todoMapper.countPending(user.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("todos", todos);
        result.put("pendingCount", pendingCount);
        return ApiResponse.ok(result);
    }

    // ===== 日程 =====

    @PostMapping("/event")
    public ApiResponse<?> createEvent(@RequestBody ScheduleEvent event, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        event.setUserId(user.getId());
        todoMapper.insertEvent(event);
        return ApiResponse.ok("创建成功", event);
    }

    @PutMapping("/event/{id}")
    public ApiResponse<?> updateEvent(@PathVariable Long id, @RequestBody ScheduleEvent event, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        ScheduleEvent existing = todoMapper.selectEventById(id);
        if (existing == null || !existing.getUserId().equals(user.getId())) {
            return ApiResponse.fail("无权操作");
        }
        event.setId(id);
        todoMapper.updateEvent(event);
        return ApiResponse.ok("更新成功");
    }

    @DeleteMapping("/event/{id}")
    public ApiResponse<?> deleteEvent(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        ScheduleEvent existing = todoMapper.selectEventById(id);
        if (existing == null || !existing.getUserId().equals(user.getId())) {
            return ApiResponse.fail("无权操作");
        }
        todoMapper.deleteEvent(id);
        return ApiResponse.ok("删除成功");
    }

    /** 日程列表（按时间范围） */
    @GetMapping("/events")
    public ApiResponse<List<ScheduleEvent>> events(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date start,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date end,
            HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        return ApiResponse.ok(todoMapper.selectEventsByUser(user.getId(), start, end));
    }
}
