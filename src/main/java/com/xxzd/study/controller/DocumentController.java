package com.xxzd.study.controller;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.Document;
import com.xxzd.study.domain.User;
import com.xxzd.study.service.DocumentService;

@RestController
@RequestMapping("/api/document")
public class DocumentController {

    @Resource
    private com.xxzd.study.service.DocumentService documentService;

    @Resource
    private com.xxzd.study.service.OssService ossService;

    @Resource
    private com.xxzd.study.config.properties.OssProperties ossProperties;

    @Resource
    private com.xxzd.study.ai.EmbeddingService embeddingService;

    @Resource
    private com.xxzd.study.mapper.DocumentEmbeddingMapper documentEmbeddingMapper;

    @Resource
    private com.xxzd.study.mapper.DocumentChunkMapper documentChunkMapper;

    @Resource
    private com.xxzd.study.ai.VectorRagService vectorRagService;

    /** OSS 是否已配置 */
    private boolean isOssConfigured() {
        String keyId = ossProperties.getAccessKeyId();
        return keyId != null && !keyId.isBlank() && !keyId.contains("your-access-key-id");
    }

    @PostMapping("/upload")
    public ApiResponse<DocumentInfo> upload(MultipartFile file, HttpSession session) throws IOException {
        if (file == null || file.isEmpty()) {
            return ApiResponse.fail("上传文件不能为空");
        }
        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof User)) {
            return ApiResponse.fail("请先登录后再上传文档");
        }
        User user = (User) userObj;

        // 鉴权：只有教师可以上传文档
        if (!"teacher".equals(user.getRole())) {
            return ApiResponse.fail("只有教师可以上传文档");
        }

        Document document = null;
        String storedName = null;
        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.trim().isEmpty()) {
                originalFilename = "unnamed";
            }

            // 1. 保存数据库记录
            document = documentService.saveDocument(originalFilename, user);

            if (isOssConfigured()) {
                // ---- OSS 路径 ----
                storedName = "documents/" + document.getId() + "/" + originalFilename;
                try (java.io.InputStream is = file.getInputStream()) {
                    ossService.upload(storedName, is);
                }
                documentService.updateStoredFilename(document.getId(), storedName);
            } else {
                // ---- 本地存储降级路径 ----
                String baseDir = System.getProperty("user.home") + File.separator + "study-ai-uploads";
                Path dir = Paths.get(baseDir);
                Files.createDirectories(dir);
                storedName = document.getId() + "_" + originalFilename;
                Path dest = dir.resolve(storedName);
                try (java.io.InputStream is = file.getInputStream()) {
                    Files.copy(is, dest, StandardCopyOption.REPLACE_EXISTING);
                }
                documentService.updateStoredFilename(document.getId(), storedName);
            }

            // 2. 解析文档并切片入库
            try (java.io.InputStream is = file.getInputStream()) {
                documentService.rebuildChunks(document.getId(), is, originalFilename);
            }

            // 3. 异步向量化（后台进行，不阻塞上传响应）
            final Long docId = document.getId();
            Thread t = new Thread(() -> vectorizeDocument(docId), "vectorize-doc-" + docId);
            t.setDaemon(true);
            t.start();

            DocumentInfo info = new DocumentInfo();
            info.setId(document.getId());
            info.setName(document.getName());
            info.setUploaderId(document.getUploaderId());
            return ApiResponse.ok("上传成功", info);
        } catch (Exception e) {
            // 回滚：删除数据库记录
            if (document != null && document.getId() != null) {
                documentService.deleteById(document.getId());
            }
            // 回滚存储
            if (storedName != null) {
                if (storedName.startsWith("documents/")) {
                    try { ossService.delete(storedName); } catch (Exception ignore) {}
                } else {
                    try {
                        Path p = Paths.get(System.getProperty("user.home"), "study-ai-uploads", storedName);
                        Files.deleteIfExists(p);
                    } catch (Exception ignore) {}
                }
            }
            return ApiResponse.fail("上传处理失败：" + e.getMessage());
        }
    }

    @GetMapping("/list")
    public ApiResponse<List<DocumentInfo>> list() {
        List<Document> documents = documentService.listAll();
        List<DocumentInfo> list = new java.util.ArrayList<>();
        for (Document d : documents) {
            DocumentInfo info = new DocumentInfo();
            info.setId(d.getId());
            info.setName(d.getName());
            info.setUploaderId(d.getUploaderId());
            list.add(info);
        }
        return ApiResponse.ok(list);
    }

    @GetMapping("/download/{id}")
    public void download(@PathVariable("id") Long id, HttpServletResponse response) throws IOException {
        Document document = documentService.findById(id);
        if (document == null) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        
        String stored = document.getStoredFilename();
        if (stored != null && stored.startsWith("documents/")) {
             // OSS
             String url = ossService.getUrl(stored);
             response.sendRedirect(url);
             return;
        }

        String baseDir = System.getProperty("user.home") + File.separator + "study-ai-uploads";
        if (stored == null || stored.trim().isEmpty()) {
             stored = id + "_" + document.getName();
        }
        File file = new File(baseDir, stored);
        if (!file.exists()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        String encodedName = URLEncoder.encode(document.getName(), StandardCharsets.UTF_8.name()).replaceAll("\\+", "%20");
        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + encodedName);
        java.nio.file.Files.copy(file.toPath(), response.getOutputStream());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable("id") Long id, HttpSession session) {
        Object userObj = session.getAttribute("currentUser");
        if (!(userObj instanceof User)) {
            return ApiResponse.fail("未登录");
        }
        User user = (User) userObj;
        
        // 权限检查：只有教师可以删除文档
        if (!"teacher".equals(user.getRole())) {
            return ApiResponse.fail("只有教师可以删除文档");
        }
        
        Document document = documentService.findById(id);
        if (document == null) {
            return ApiResponse.fail("文档不存在");
        }
        boolean ok = documentService.deleteById(id);
        if (!ok) {
            return ApiResponse.fail("删除文档失败");
        }
        
        String stored = document.getStoredFilename();
        if (stored != null && stored.startsWith("documents/")) {
            try {
                ossService.delete(stored);
            } catch (Exception e) {
                // Log warning but don't fail, as DB is already deleted
            }
        } else {
            String baseDir = System.getProperty("user.home") + File.separator + "study-ai-uploads";
            if (stored == null || stored.trim().isEmpty()) {
                stored = id + "_" + document.getName();
            }
            File file = new File(baseDir, stored);
            if (file.exists()) {
                file.delete();
            }
        }
        return ApiResponse.ok(null);
    }

    /**
     * 异步向量化：为文档每个 chunk 生成 BGE-M3 向量，写入 Chroma（同时备份到 MySQL）
     */
    private void vectorizeDocument(Long documentId) {
        try {
            java.util.List<com.xxzd.study.domain.DocumentChunk> chunks =
                    documentChunkMapper.selectByDocumentId(documentId);
            if (chunks == null || chunks.isEmpty()) return;

            int success = 0;
            for (com.xxzd.study.domain.DocumentChunk chunk : chunks) {
                try {
                    // 1. 生成向量
                    float[] vec = embeddingService.embed(chunk.getContent());

                    // 2. 写入 Chroma（主存储）
                    vectorRagService.indexChunk(chunk, vec);

                    // 3. 备份到 MySQL（降级兜底）
                    com.xxzd.study.domain.DocumentEmbedding emb = new com.xxzd.study.domain.DocumentEmbedding();
                    emb.setChunkId(chunk.getId());
                    emb.setVectorJson(com.xxzd.study.ai.EmbeddingService.toJson(vec));
                    documentEmbeddingMapper.deleteByChunkId(chunk.getId());
                    documentEmbeddingMapper.insert(emb);

                    success++;
                } catch (Exception e) {
                    System.err.println("[VectorRAG] chunk " + chunk.getId() + " 向量化失败: " + e.getMessage());
                }
            }
            System.out.println("[VectorRAG] ✅ 文档 " + documentId + " 向量化完成 " + success + "/" + chunks.size() + " 个切片");
        } catch (Exception e) {
            System.err.println("[VectorRAG] ❌ 文档 " + documentId + " 向量化失败: " + e.getMessage());
        }
    }

    public static class DocumentInfo {

        private Long id;

        private String name;

        private Long uploaderId;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Long getUploaderId() {
            return uploaderId;
        }

        public void setUploaderId(Long uploaderId) {
            this.uploaderId = uploaderId;
        }
    }
}
