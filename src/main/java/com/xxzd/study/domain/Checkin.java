package com.xxzd.study.domain;
import java.util.Date;
public class Checkin {
    private Long id;
    private Long userId;
    private Date checkinDate;
    private Integer studyMinutes;
    private String content;
    private Date createTime;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Long getUserId(){return userId;} public void setUserId(Long userId){this.userId=userId;}
    public Date getCheckinDate(){return checkinDate;} public void setCheckinDate(Date d){this.checkinDate=d;}
    public Integer getStudyMinutes(){return studyMinutes;} public void setStudyMinutes(Integer m){this.studyMinutes=m;}
    public String getContent(){return content;} public void setContent(String c){this.content=c;}
    public Date getCreateTime(){return createTime;} public void setCreateTime(Date t){this.createTime=t;}
}
