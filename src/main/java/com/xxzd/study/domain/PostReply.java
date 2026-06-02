package com.xxzd.study.domain;
import java.util.Date;
public class PostReply {
    private Long id;
    private Long postId;
    private Long userId;
    private Long parentReplyId;
    private String content;
    private Boolean isAiGenerated;
    private Date createTime;
    private String authorName;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Long getPostId(){return postId;} public void setPostId(Long postId){this.postId=postId;}
    public Long getUserId(){return userId;} public void setUserId(Long userId){this.userId=userId;}
    public Long getParentReplyId(){return parentReplyId;} public void setParentReplyId(Long p){this.parentReplyId=p;}
    public String getContent(){return content;} public void setContent(String c){this.content=c;}
    public Boolean getIsAiGenerated(){return isAiGenerated;} public void setIsAiGenerated(Boolean a){this.isAiGenerated=a;}
    public Date getCreateTime(){return createTime;} public void setCreateTime(Date t){this.createTime=t;}
    public String getAuthorName(){return authorName;} public void setAuthorName(String n){this.authorName=n;}
}
