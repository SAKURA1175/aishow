package com.xxzd.study.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class WebSearchService {

    private static final Logger log = LoggerFactory.getLogger(WebSearchService.class);

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Docker 内部地址（容器间通信）和宿主机地址（本地开发调试）
     */
    private static final String[] SEARXNG_URLS = {
        "http://searxng:8080/search?q={q}&format=json",
        "http://localhost:8081/search?q={q}&format=json"
    };

    public List<Map<String, String>> search(String query) {
        List<Map<String, String>> results = new ArrayList<>();
        if (query == null || query.trim().isEmpty()) return results;

        for (String url : SEARXNG_URLS) {
            try {
                log.info("[WebSearch] 尝试搜索: {} , query={}", url, query);
                ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class, query.trim());

                if (response != null && response.getBody() != null) {
                    List<Map<String, Object>> items = (List<Map<String, Object>>) response.getBody().get("results");
                    if (items != null) {
                        for (int i = 0; i < Math.min(items.size(), 5); i++) {
                            Map<String, Object> item = items.get(i);
                            String title = (String) item.get("title");
                            String urlStr = (String) item.get("url");
                            String content = (String) item.get("content");
                            if (content == null || content.trim().isEmpty()) continue;

                            Map<String, String> res = new LinkedHashMap<>();
                            res.put("title", title != null ? title : "");
                            res.put("url", urlStr != null ? urlStr : "");
                            res.put("snippet", content.trim());
                            results.add(res);
                        }
                    }
                }
                log.info("[WebSearch] 搜索成功，返回 {} 条结果", results.size());
                return results; // 成功就返回，不再尝试下一个 URL
            } catch (Exception e) {
                log.warn("[WebSearch] {} 请求失败: {}", url, e.getMessage());
            }
        }

        log.warn("[WebSearch] 所有 SearxNG 地址均不可用");
        return results;
    }
}

