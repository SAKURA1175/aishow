package com.xxzd.study.domain;

import java.util.Date;

public class Resume {

    private Long id;
    private Long userId;
    private String filename;
    private String fileType;      // pdf / docx / txt
    private String rawText;
    private String structuredJson;
    private String analysisJson;
    private Integer score;        // 0-100
    private Date createTime;
    private Date updateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }

    public String getStructuredJson() { return structuredJson; }
    public void setStructuredJson(String structuredJson) { this.structuredJson = structuredJson; }

    public String getAnalysisJson() { return analysisJson; }
    public void setAnalysisJson(String analysisJson) { this.analysisJson = analysisJson; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }
}
