package com.xxzd.study.domain;

public class LearningProfile {

    private Long userId;

    private String weakTopics;

    private String strongTopics;

    private String suggestion;

    // 前端画像页面消费的扩展视图字段（非持久化或组装字段）
    private java.util.List<TopicSummary> topicSummaries;
    private String dominantSubject;
    private java.util.List<String> weakAreas;
    private String activityLevel;
    private String summary;

    public static class TopicSummary {
        private String topic;
        private int questionCount;
        private String masteryLevel; // HIGH / MEDIUM / LOW

        public TopicSummary() {}
        public TopicSummary(String topic, int questionCount, String masteryLevel) {
            this.topic = topic;
            this.questionCount = questionCount;
            this.masteryLevel = masteryLevel;
        }
        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }
        public int getQuestionCount() { return questionCount; }
        public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
        public String getMasteryLevel() { return masteryLevel; }
        public void setMasteryLevel(String masteryLevel) { this.masteryLevel = masteryLevel; }
    }

    public java.util.List<TopicSummary> getTopicSummaries() { return topicSummaries; }
    public void setTopicSummaries(java.util.List<TopicSummary> topicSummaries) { this.topicSummaries = topicSummaries; }

    public String getDominantSubject() { return dominantSubject; }
    public void setDominantSubject(String dominantSubject) { this.dominantSubject = dominantSubject; }

    public java.util.List<String> getWeakAreas() { return weakAreas; }
    public void setWeakAreas(java.util.List<String> weakAreas) { this.weakAreas = weakAreas; }

    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getWeakTopics() {
        return weakTopics;
    }

    public void setWeakTopics(String weakTopics) {
        this.weakTopics = weakTopics;
    }

    public String getStrongTopics() {
        return strongTopics;
    }

    public void setStrongTopics(String strongTopics) {
        this.strongTopics = strongTopics;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }
}

