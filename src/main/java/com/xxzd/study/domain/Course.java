package com.xxzd.study.domain;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 课程
 */
public class Course {

    private Long id;
    private String name;
    private BigDecimal credit;
    private String semester;
    private Long teacherId;
    private Long classId;
    private Date createTime;

    // 非持久化
    private String teacherName;
    private String className;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getCredit() { return credit; }
    public void setCredit(BigDecimal credit) { this.credit = credit; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }
    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
}
