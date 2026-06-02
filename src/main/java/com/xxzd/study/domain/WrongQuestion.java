package com.xxzd.study.domain;
import java.util.Date;
public class WrongQuestion {
    private Long id;
    private Long userId;
    private String subject;
    private String content;
    private String correctAnswer;
    private String myAnswer;
    private String aiAnalysis;
    private String knowledgePoint;
    private String mastery;
    private String source;
    private Long sourceId;
    private Date createTime;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Long getUserId(){return userId;} public void setUserId(Long userId){this.userId=userId;}
    public String getSubject(){return subject;} public void setSubject(String subject){this.subject=subject;}
    public String getContent(){return content;} public void setContent(String content){this.content=content;}
    public String getCorrectAnswer(){return correctAnswer;} public void setCorrectAnswer(String correctAnswer){this.correctAnswer=correctAnswer;}
    public String getMyAnswer(){return myAnswer;} public void setMyAnswer(String myAnswer){this.myAnswer=myAnswer;}
    public String getAiAnalysis(){return aiAnalysis;} public void setAiAnalysis(String aiAnalysis){this.aiAnalysis=aiAnalysis;}
    public String getKnowledgePoint(){return knowledgePoint;} public void setKnowledgePoint(String knowledgePoint){this.knowledgePoint=knowledgePoint;}
    public String getMastery(){return mastery;} public void setMastery(String mastery){this.mastery=mastery;}
    public String getSource(){return source;} public void setSource(String source){this.source=source;}
    public Long getSourceId(){return sourceId;} public void setSourceId(Long sourceId){this.sourceId=sourceId;}
    public Date getCreateTime(){return createTime;} public void setCreateTime(Date createTime){this.createTime=createTime;}
}
