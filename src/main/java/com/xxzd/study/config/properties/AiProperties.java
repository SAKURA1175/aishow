package com.xxzd.study.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    private String model;

    private Api api = new Api();

    private Embedding embedding = new Embedding();

    private Rag rag = new Rag();

    private Chroma chroma = new Chroma();

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Api getApi() {
        return api;
    }

    public void setApi(Api api) {
        this.api = api;
    }

    public Embedding getEmbedding() {
        return embedding;
    }

    public void setEmbedding(Embedding embedding) {
        this.embedding = embedding;
    }

    public Rag getRag() {
        return rag;
    }

    public void setRag(Rag rag) {
        this.rag = rag;
    }

    public Chroma getChroma() {
        return chroma;
    }

    public void setChroma(Chroma chroma) {
        this.chroma = chroma;
    }

    public static class Api {

        private String url;

        private String key;

        private int connectTimeoutMs = 2000;

        private int readTimeoutMs = 90000;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public int getConnectTimeoutMs() {
            return connectTimeoutMs;
        }

        public void setConnectTimeoutMs(int connectTimeoutMs) {
            this.connectTimeoutMs = connectTimeoutMs;
        }

        public int getReadTimeoutMs() {
            return readTimeoutMs;
        }

        public void setReadTimeoutMs(int readTimeoutMs) {
            this.readTimeoutMs = readTimeoutMs;
        }
    }

    public static class Embedding {

        private boolean enabled = true;

        private String model = "text-embedding-bge-m3";

        private String apiUrl;

        private String apiKey;

        private int connectTimeoutMs = 2000;

        private int readTimeoutMs = 15000;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public String getApiUrl() {
            return apiUrl;
        }

        public void setApiUrl(String apiUrl) {
            this.apiUrl = apiUrl;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public int getConnectTimeoutMs() {
            return connectTimeoutMs;
        }

        public void setConnectTimeoutMs(int connectTimeoutMs) {
            this.connectTimeoutMs = connectTimeoutMs;
        }

        public int getReadTimeoutMs() {
            return readTimeoutMs;
        }

        public void setReadTimeoutMs(int readTimeoutMs) {
            this.readTimeoutMs = readTimeoutMs;
        }
    }

    public static class Rag {

        private int retrievalTopK = 4;

        private int maxPromptChars = 1400;

        private int maxSnippetChars = 320;

        private int maxHistoryMessages = 8;

        private int maxHistoryChars = 2400;

        private int maxFallbackScanRows = 2000;

        public int getRetrievalTopK() {
            return retrievalTopK;
        }

        public void setRetrievalTopK(int retrievalTopK) {
            this.retrievalTopK = retrievalTopK;
        }

        public int getMaxPromptChars() {
            return maxPromptChars;
        }

        public void setMaxPromptChars(int maxPromptChars) {
            this.maxPromptChars = maxPromptChars;
        }

        public int getMaxSnippetChars() {
            return maxSnippetChars;
        }

        public void setMaxSnippetChars(int maxSnippetChars) {
            this.maxSnippetChars = maxSnippetChars;
        }

        public int getMaxHistoryMessages() {
            return maxHistoryMessages;
        }

        public void setMaxHistoryMessages(int maxHistoryMessages) {
            this.maxHistoryMessages = maxHistoryMessages;
        }

        public int getMaxHistoryChars() {
            return maxHistoryChars;
        }

        public void setMaxHistoryChars(int maxHistoryChars) {
            this.maxHistoryChars = maxHistoryChars;
        }

        public int getMaxFallbackScanRows() {
            return maxFallbackScanRows;
        }

        public void setMaxFallbackScanRows(int maxFallbackScanRows) {
            this.maxFallbackScanRows = maxFallbackScanRows;
        }
    }

    public static class Chroma {

        private String baseUrl = "http://localhost:8000/api/v2";

        private String tenant = "default_tenant";

        private String database = "default_database";

        private String collection = "study_docs";

        private int connectTimeoutMs = 1500;

        private int readTimeoutMs = 4000;

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getTenant() {
            return tenant;
        }

        public void setTenant(String tenant) {
            this.tenant = tenant;
        }

        public String getDatabase() {
            return database;
        }

        public void setDatabase(String database) {
            this.database = database;
        }

        public String getCollection() {
            return collection;
        }

        public void setCollection(String collection) {
            this.collection = collection;
        }

        public int getConnectTimeoutMs() {
            return connectTimeoutMs;
        }

        public void setConnectTimeoutMs(int connectTimeoutMs) {
            this.connectTimeoutMs = connectTimeoutMs;
        }

        public int getReadTimeoutMs() {
            return readTimeoutMs;
        }

        public void setReadTimeoutMs(int readTimeoutMs) {
            this.readTimeoutMs = readTimeoutMs;
        }
    }
}
