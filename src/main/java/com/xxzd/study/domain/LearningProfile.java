package com.xxzd.study.domain;

public class LearningProfile {

    private Long userId;

    private String weakTopics;

    private String strongTopics;

    private String suggestion;

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

