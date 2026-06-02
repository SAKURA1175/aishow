package com.xxzd.study.domain;
import java.util.Date;
public class Exam {
    private Long id;
    private String title;
    private Long courseId;
    private Long teacherId;
    private Long classId;
    private Integer duration;
    private Integer totalScore;
    private String status;
    private Date startTime;
    private Date endTime;
    private Date createTime;
    private String teacherName;
    private Integer questionCount;
    private Integer submissionCount;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getTitle(){return title;} public void setTitle(String t){this.title=t;}
    public Long getCourseId(){return courseId;} public void setCourseId(Long c){this.courseId=c;}
    public Long getTeacherId(){return teacherId;} public void setTeacherId(Long t){this.teacherId=t;}
    public Long getClassId(){return classId;} public void setClassId(Long c){this.classId=c;}
    public Integer getDuration(){return duration;} public void setDuration(Integer d){this.duration=d;}
    public Integer getTotalScore(){return totalScore;} public void setTotalScore(Integer s){this.totalScore=s;}
    public String getStatus(){return status;} public void setStatus(String s){this.status=s;}
    public Date getStartTime(){return startTime;} public void setStartTime(Date t){this.startTime=t;}
    public Date getEndTime(){return endTime;} public void setEndTime(Date t){this.endTime=t;}
    public Date getCreateTime(){return createTime;} public void setCreateTime(Date t){this.createTime=t;}
    public String getTeacherName(){return teacherName;} public void setTeacherName(String n){this.teacherName=n;}
    public Integer getQuestionCount(){return questionCount;} public void setQuestionCount(Integer c){this.questionCount=c;}
    public Integer getSubmissionCount(){return submissionCount;} public void setSubmissionCount(Integer c){this.submissionCount=c;}
}
