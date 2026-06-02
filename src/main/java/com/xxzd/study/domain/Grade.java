package com.xxzd.study.domain;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 成绩
 */
public class Grade {

    private Long id;
    private Long userId;
    private Long courseId;
    private BigDecimal score;
    private BigDecimal gradePoint;
    private String gradeType;
    private String semester;
    private String remark;
    private Date createTime;

    // 非持久化
    private String courseName;
    private BigDecimal courseCredit;
    private String studentName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }
    public BigDecimal getGradePoint() { return gradePoint; }
    public void setGradePoint(BigDecimal gradePoint) { this.gradePoint = gradePoint; }
    public String getGradeType() { return gradeType; }
    public void setGradeType(String gradeType) { this.gradeType = gradeType; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public BigDecimal getCourseCredit() { return courseCredit; }
    public void setCourseCredit(BigDecimal courseCredit) { this.courseCredit = courseCredit; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
}
