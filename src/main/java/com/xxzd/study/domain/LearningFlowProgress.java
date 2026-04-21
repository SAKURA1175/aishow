package com.xxzd.study.domain;

import java.util.Date;

public class LearningFlowProgress {

    private Long id;
    private Long userId;
    private String flowType;     // resume_basics
    private Integer currentStep;
    private Integer totalSteps;
    private String stepData;     // JSON: 各步骤用户输入和 AI 反馈
    private String status;       // in_progress / completed
    private Date createTime;
    private Date updateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFlowType() { return flowType; }
    public void setFlowType(String flowType) { this.flowType = flowType; }

    public Integer getCurrentStep() { return currentStep; }
    public void setCurrentStep(Integer currentStep) { this.currentStep = currentStep; }

    public Integer getTotalSteps() { return totalSteps; }
    public void setTotalSteps(Integer totalSteps) { this.totalSteps = totalSteps; }

    public String getStepData() { return stepData; }
    public void setStepData(String stepData) { this.stepData = stepData; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }
}
