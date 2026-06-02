package com.xxzd.study.domain;
public class ExamQuestion {
    private Long id;
    private Long examId;
    private String type;
    private String content;
    private String options;
    private String answer;
    private Integer score;
    private Integer sortOrder;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Long getExamId(){return examId;} public void setExamId(Long e){this.examId=e;}
    public String getType(){return type;} public void setType(String t){this.type=t;}
    public String getContent(){return content;} public void setContent(String c){this.content=c;}
    public String getOptions(){return options;} public void setOptions(String o){this.options=o;}
    public String getAnswer(){return answer;} public void setAnswer(String a){this.answer=a;}
    public Integer getScore(){return score;} public void setScore(Integer s){this.score=s;}
    public Integer getSortOrder(){return sortOrder;} public void setSortOrder(Integer s){this.sortOrder=s;}
}
