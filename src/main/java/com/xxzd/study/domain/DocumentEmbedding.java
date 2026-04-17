package com.xxzd.study.domain;

public class DocumentEmbedding {
    private Long id;
    private Long chunkId;
    private String vectorJson; // JSON 格式的 float[]

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getChunkId() { return chunkId; }
    public void setChunkId(Long chunkId) { this.chunkId = chunkId; }
    public String getVectorJson() { return vectorJson; }
    public void setVectorJson(String vectorJson) { this.vectorJson = vectorJson; }
}
