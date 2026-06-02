package com.xxzd.study.domain;
import java.util.Date;
public class Post {
    private Long id;
    private Long userId;
    private Long courseId;
    private String title;
    private String content;
    private String tags;
    private Boolean isPinned;
    private Boolean isFeatured;
    private Integer viewCount;
    private Integer replyCount;
    private Date createTime;
    private Date updateTime;
    private String authorName;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Long getUserId(){return userId;} public void setUserId(Long userId){this.userId=userId;}
    public Long getCourseId(){return courseId;} public void setCourseId(Long courseId){this.courseId=courseId;}
    public String getTitle(){return title;} public void setTitle(String title){this.title=title;}
    public String getContent(){return content;} public void setContent(String content){this.content=content;}
    public String getTags(){return tags;} public void setTags(String tags){this.tags=tags;}
    public Boolean getIsPinned(){return isPinned;} public void setIsPinned(Boolean p){this.isPinned=p;}
    public Boolean getIsFeatured(){return isFeatured;} public void setIsFeatured(Boolean f){this.isFeatured=f;}
    public Integer getViewCount(){return viewCount;} public void setViewCount(Integer c){this.viewCount=c;}
    public Integer getReplyCount(){return replyCount;} public void setReplyCount(Integer c){this.replyCount=c;}
    public Date getCreateTime(){return createTime;} public void setCreateTime(Date t){this.createTime=t;}
    public Date getUpdateTime(){return updateTime;} public void setUpdateTime(Date t){this.updateTime=t;}
    public String getAuthorName(){return authorName;} public void setAuthorName(String n){this.authorName=n;}
}
