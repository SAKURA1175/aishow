package com.xxzd.study.controller;
import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.Checkin;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.CheckinMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
@RestController
@RequestMapping("/api/checkin")
public class CheckinController {
    @Resource private CheckinMapper mapper;
    @PostMapping
    public ApiResponse<?> checkin(@RequestBody Checkin c, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        if(mapper.selectToday(u.getId())!=null) return ApiResponse.fail("今天已打卡");
        c.setUserId(u.getId()); c.setCheckinDate(new Date());
        mapper.insert(c);
        mapper.addPoints(u.getId(), "checkin", 10, "每日打卡 +10");
        return ApiResponse.ok("打卡成功！+10积分", c);
    }
    @GetMapping("/stats")
    public ApiResponse<?> stats(HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        Map<String,Object> m = new HashMap<>();
        m.put("totalDays", mapper.countTotal(u.getId()));
        m.put("totalMinutes", mapper.sumMinutes(u.getId()));
        m.put("totalPoints", mapper.totalPoints(u.getId()));
        m.put("todayChecked", mapper.selectToday(u.getId())!=null);
        m.put("recentPoints", mapper.recentPoints(u.getId()));
        m.put("history", mapper.selectByUser(u.getId()));
        return ApiResponse.ok(m);
    }
}
