package com.xxzd.study.service;

import com.xxzd.study.domain.HierarchyNode;
import com.xxzd.study.domain.LearningProfile;
import com.xxzd.study.domain.User;

public interface LearningProfileService {

    void recordQuestion(User user, String question);

    LearningProfile buildProfile(User user);

    /**
     * 构建学习画像的层次结构数据，用于 D3 Radial Cluster 可视化
     */
    HierarchyNode buildHierarchy(User user);
}

