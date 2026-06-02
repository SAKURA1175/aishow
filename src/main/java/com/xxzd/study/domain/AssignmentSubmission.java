package com.xxzd.study.domain;

import java.util.Date;

/**
 * 作业提交
 */
public class AssignmentSubmission {

    private Long id;
    private Long assignmentId;
    private Long studentId;
    private String content;
    private String fileUrl;
    private Integer aiScore;
    private String aiFeedback;
    private Integer teacherScore;
    private String teacherFeedback;
    private String status;
    private Date submitTime;
    private Date gradeTime;

    // 非持久化
    private String studentName;
    private String assignmentTitle;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public Integer getAiScore() { return aiScore; }
    public void setAiScore(Integer aiScore) { this.aiScore = aiScore; }
    public String getAiFeedback() { return aiFeedback; }
    public void setAiFeedback(String aiFeedback) { this.aiFeedback = aiFeedback; }
    public Integer getTeacherScore() { return teacherScore; }
    public void setTeacherScore(Integer teacherScore) { this.teacherScore = teacherScore; }
    public String getTeacherFeedback() { return teacherFeedback; }
    public void setTeacherFeedback(String teacherFeedback) { this.teacherFeedback = teacherFeedback; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Date getSubmitTime() { return submitTime; }
    public void setSubmitTime(Date submitTime) { this.submitTime = submitTime; }
    public Date getGradeTime() { return gradeTime; }
    public void setGradeTime(Date gradeTime) { this.gradeTime = gradeTime; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getAssignmentTitle() { return assignmentTitle; }
    public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
}
