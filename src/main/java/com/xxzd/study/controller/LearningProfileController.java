package com.xxzd.study.controller;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.HierarchyNode;
import com.xxzd.study.domain.LearningProfile;
import com.xxzd.study.domain.User;
import com.xxzd.study.service.LearningProfileService;

@RestController
@RequestMapping("/api/profile")
public class LearningProfileController {

    @Resource
    private LearningProfileService learningProfileService;

    @GetMapping("/current")
    public ApiResponse<LearningProfile> current(HttpSession session) {
        Object obj = session.getAttribute("currentUser");
        if (!(obj instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        User user = (User) obj;
        LearningProfile profile = learningProfileService.buildProfile(user);
        return ApiResponse.ok(profile);
    }

    /**
     * 获取学习画像的层次结构数据，用于 D3 Radial Cluster 可视化
     */
    @GetMapping("/hierarchy")
    public ApiResponse<HierarchyNode> hierarchy(HttpSession session) {
        Object obj = session.getAttribute("currentUser");
        if (!(obj instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        User user = (User) obj;
        HierarchyNode hierarchy = learningProfileService.buildHierarchy(user);
        return ApiResponse.ok(hierarchy);
    }
}

