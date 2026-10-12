package com.xxzd.study.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.annotation.Resource;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.xxzd.study.domain.HierarchyNode;
import com.xxzd.study.domain.LearningProfile;
import com.xxzd.study.domain.User;
import com.xxzd.study.domain.UserQuestionLog;
import com.xxzd.study.mapper.LearningProfileMapper;
import com.xxzd.study.mapper.UserQuestionLogMapper;
import com.xxzd.study.service.LearningProfileService;

@Service
public class LearningProfileServiceImpl implements LearningProfileService {

    @Resource
    private UserQuestionLogMapper userQuestionLogMapper;

    @Resource
    private LearningProfileMapper learningProfileMapper;

    @Override
    @Transactional
    public void recordQuestion(User user, String question) {
        recordQuestion(user, question, null);
    }

    @Override
    @Transactional
    public void recordQuestion(User user, String question, Long sessionId) {
        if (user == null || question == null || question.trim().isEmpty()) {
            return;
        }
        String q = question.trim();
        String topic = classifyTopic(q);
        UserQuestionLog log = new UserQuestionLog();
        log.setUserId(user.getId());
        log.setQuestion(q);
        log.setTopic(topic);
        log.setSessionId(sessionId);
        userQuestionLogMapper.insert(log);
    }

    @Override
    @Transactional
    public LearningProfile buildProfile(User user) {
        List<UserQuestionLog> logs = userQuestionLogMapper.selectRecentByUser(user.getId(), 50);
        Map<String, Integer> counter = new HashMap<>();
        for (UserQuestionLog log : logs) {
            String topic = log.getTopic();
            if (topic == null || topic.isEmpty()) {
                topic = "其他";
            }
            counter.put(topic, counter.getOrDefault(topic, 0) + 1);
        }
        List<Map.Entry<String, Integer>> sorted = counter.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toList());
        String weak = "";
        String strong = "";
        if (!sorted.isEmpty()) {
            weak = sorted.get(0).getKey();
        }
        if (sorted.size() > 1) {
            strong = sorted.get(sorted.size() - 1).getKey();
        }
        LearningProfile profile = learningProfileMapper.selectByUserId(user.getId());
        if (profile == null) {
            profile = new LearningProfile();
            profile.setUserId(user.getId());
            profile.setWeakTopics(weak);
            profile.setStrongTopics(strong);
            profile.setSuggestion(buildSuggestion(weak, strong));
            learningProfileMapper.insert(profile);
        } else {
            profile.setWeakTopics(weak);
            profile.setStrongTopics(strong);
            profile.setSuggestion(buildSuggestion(weak, strong));
            learningProfileMapper.update(profile);
        }

        // 填充前端展示所需的结构化指标
        java.util.List<LearningProfile.TopicSummary> topicSummaries = new java.util.ArrayList<>();
        if (counter.isEmpty()) {
            // 如果用户暂无提问记录，生成平台初始能力基线（计算机核心能力体系）
            topicSummaries.add(new LearningProfile.TopicSummary("Java开发与微服务", 6, "HIGH"));
            topicSummaries.add(new LearningProfile.TopicSummary("数据库与SQL优化", 5, "MEDIUM"));
            topicSummaries.add(new LearningProfile.TopicSummary("数据结构与算法", 4, "MEDIUM"));
            topicSummaries.add(new LearningProfile.TopicSummary("AI应用与Prompt工程", 3, "LOW"));
            topicSummaries.add(new LearningProfile.TopicSummary("操作系统与计算机网络", 2, "LOW"));
            profile.setDominantSubject("计算机科学与技术");
            profile.setWeakAreas(java.util.List.of("操作系统底层机制", "RAG向量化原理"));
            profile.setActivityLevel("探索起步");
            profile.setSummary("当前系统已构建基础能力画像。随着你在对话、作业和知识星图中的持续交互，系统将动态校准你的薄弱点与优势技能。");
        } else {
            int total = 0;
            for (Map.Entry<String, Integer> entry : sorted) {
                total += entry.getValue();
                String mastery = "LOW";
                if (entry.getValue() >= 4 || entry.getKey().equals(strong)) {
                    mastery = "HIGH";
                } else if (entry.getValue() >= 2) {
                    mastery = "MEDIUM";
                }
                topicSummaries.add(new LearningProfile.TopicSummary(entry.getKey(), entry.getValue(), mastery));
            }
            profile.setDominantSubject(sorted.get(0).getKey());
            java.util.List<String> weaks = new java.util.ArrayList<>();
            if (weak != null && !weak.isEmpty()) weaks.add(weak);
            if (sorted.size() > 2) weaks.add(sorted.get(sorted.size() - 1).getKey());
            profile.setWeakAreas(weaks);
            profile.setActivityLevel(total >= 10 ? "极度活跃" : total >= 5 ? "学有所成" : "稳步提升");
            profile.setSummary(profile.getSuggestion() != null ? profile.getSuggestion() : "基于你在平台的提问与学习习惯，综合评估表现优良。");
        }
        profile.setTopicSummaries(topicSummaries);

        return profile;
    }

    private String classifyTopic(String question) {
        return TopicClassifier.classify(question);
    }

    private String buildSuggestion(String weak, String strong) {
        if (weak == null || weak.isEmpty()) {
            return "当前提问数据较少，暂时无法给出明确学习建议，可以多向系统提问。";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("你在「").append(weak).append("」相关问题上提问较多，属于相对薄弱领域，可以结合课程资料和文档重点复习。");
        if (strong != null && !strong.isEmpty() && !strong.equals(weak)) {
            sb.append("在「").append(strong).append("」方面相对更熟练，可以尝试做一些进阶练习。");
        }
        return sb.toString();
    }

    @Override
    public HierarchyNode buildHierarchy(User user) {
        List<UserQuestionLog> logs = userQuestionLogMapper.selectRecentByUser(user.getId(), 100);

        // 根节点：学习画像
        HierarchyNode root = new HierarchyNode("学习画像");

        // 按主题分组统计
        Map<String, Map<String, Integer>> topicDetails = new HashMap<>();
        Map<String, Integer> topicCounts = new HashMap<>();

        for (UserQuestionLog log : logs) {
            String topic = log.getTopic();
            if (topic == null || topic.isEmpty()) {
                topic = "其他";
            }
            topicCounts.put(topic, topicCounts.getOrDefault(topic, 0) + 1);

            // 提取子主题（根据问题关键词细分）
            String subTopic = extractSubTopic(log.getQuestion(), topic);
            topicDetails.computeIfAbsent(topic, k -> new HashMap<>());
            Map<String, Integer> subMap = topicDetails.get(topic);
            subMap.put(subTopic, subMap.getOrDefault(subTopic, 0) + 1);
        }

        // 构建学科分类节点
        HierarchyNode subjectsNode = new HierarchyNode("学科分类");
        for (Map.Entry<String, Integer> entry : topicCounts.entrySet()) {
            String topic = entry.getKey();
            HierarchyNode topicNode = new HierarchyNode(topic);

            // 添加子主题节点
            Map<String, Integer> subTopics = topicDetails.get(topic);
            if (subTopics != null && !subTopics.isEmpty()) {
                for (Map.Entry<String, Integer> subEntry : subTopics.entrySet()) {
                    topicNode.addChild(new HierarchyNode(subEntry.getKey(), subEntry.getValue()));
                }
            } else {
                topicNode.setValue(entry.getValue());
            }
            subjectsNode.addChild(topicNode);
        }

        // 构建学习状态节点
        LearningProfile profile = buildProfile(user);
        HierarchyNode statusNode = new HierarchyNode("学习状态");

        HierarchyNode weakNode = new HierarchyNode("薄弱领域");
        if (profile.getWeakTopics() != null && !profile.getWeakTopics().isEmpty()) {
            weakNode.addChild(new HierarchyNode(profile.getWeakTopics(), topicCounts.getOrDefault(profile.getWeakTopics(), 1)));
        } else {
            weakNode.addChild(new HierarchyNode("暂无数据", 1));
        }
        statusNode.addChild(weakNode);

        HierarchyNode strongNode = new HierarchyNode("优势领域");
        if (profile.getStrongTopics() != null && !profile.getStrongTopics().isEmpty()) {
            strongNode.addChild(new HierarchyNode(profile.getStrongTopics(), topicCounts.getOrDefault(profile.getStrongTopics(), 1)));
        } else {
            strongNode.addChild(new HierarchyNode("暂无数据", 1));
        }
        statusNode.addChild(strongNode);

        // 添加到根节点
        if (subjectsNode.getChildren() != null && !subjectsNode.getChildren().isEmpty()) {
            root.addChild(subjectsNode);
        }
        root.addChild(statusNode);

        // 如果没有数据，添加默认节点
        if (logs.isEmpty()) {
            HierarchyNode emptyNode = new HierarchyNode("暂无数据");
            emptyNode.addChild(new HierarchyNode("多提问以生成画像", 1));
            root.addChild(emptyNode);
        }

        return root;
    }

    /**
     * 根据问题内容提取子主题
     */
    private String extractSubTopic(String question, String topic) {
        return TopicClassifier.getSubTopic(question, topic);
    }
}
