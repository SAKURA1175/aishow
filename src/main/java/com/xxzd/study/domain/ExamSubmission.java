package com.xxzd.study.domain;
import java.util.Date;
public class ExamSubmission {
    private Long id;
    private Long examId;
    private Long studentId;
    private String answers;
    private Integer score;
    private String aiFeedback;
    private String status;
    private Date startTime;
    private Date submitTime;
    private String studentName;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Long getExamId(){return examId;} public void setExamId(Long e){this.examId=e;}
    public Long getStudentId(){return studentId;} public void setStudentId(Long s){this.studentId=s;}
    public String getAnswers(){return answers;} public void setAnswers(String a){this.answers=a;}
    public Integer getScore(){return score;} public void setScore(Integer s){this.score=s;}
    public String getAiFeedback(){return aiFeedback;} public void setAiFeedback(String f){this.aiFeedback=f;}
    public String getStatus(){return status;} public void setStatus(String s){this.status=s;}
    public Date getStartTime(){return startTime;} public void setStartTime(Date t){this.startTime=t;}
    public Date getSubmitTime(){return submitTime;} public void setSubmitTime(Date t){this.submitTime=t;}
    public String getStudentName(){return studentName;} public void setStudentName(String n){this.studentName=n;}
}
