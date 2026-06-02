package com.xxzd.study.domain;
import java.util.Date;
public class Notebook {
    private Long id;
    private Long userId;
    private Long courseId;
    private String title;
    private String content;
    private String aiSummary;
    private String tags;
    private Boolean isShared;
    private Date createTime;
    private Date updateTime;
    private String authorName;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Long getUserId(){return userId;} public void setUserId(Long userId){this.userId=userId;}
    public Long getCourseId(){return courseId;} public void setCourseId(Long courseId){this.courseId=courseId;}
    public String getTitle(){return title;} public void setTitle(String title){this.title=title;}
    public String getContent(){return content;} public void setContent(String content){this.content=content;}
    public String getAiSummary(){return aiSummary;} public void setAiSummary(String aiSummary){this.aiSummary=aiSummary;}
    public String getTags(){return tags;} public void setTags(String tags){this.tags=tags;}
    public Boolean getIsShared(){return isShared;} public void setIsShared(Boolean isShared){this.isShared=isShared;}
    public Date getCreateTime(){return createTime;} public void setCreateTime(Date createTime){this.createTime=createTime;}
    public Date getUpdateTime(){return updateTime;} public void setUpdateTime(Date updateTime){this.updateTime=updateTime;}
    public String getAuthorName(){return authorName;} public void setAuthorName(String authorName){this.authorName=authorName;}
}
