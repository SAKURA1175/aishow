package com.xxzd.study.controller;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.StandardCopyOption;
import java.util.List;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

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
    private DocumentService documentService;

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
        File dest = null;
        try {
            String baseDir = System.getProperty("user.home") + File.separator + "study-ai-uploads";
            File dir = new File(baseDir);
            if (!dir.exists()) {
                boolean created = dir.mkdirs();
                if (!created && !dir.exists()) {
                    return ApiResponse.fail("服务器创建上传目录失败");
                }
            }
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.trim().isEmpty()) {
                originalFilename = "unnamed";
            }
            String safeOriginalFilename = originalFilename.replace("\\", "_").replace("/", "_");
            document = documentService.saveDocument(originalFilename, user);
            String stored = document.getId() + "_" + safeOriginalFilename;
            dest = new File(dir, stored);
            java.nio.file.Files.copy(file.getInputStream(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);

            documentService.updateStoredFilename(document.getId(), stored);
            documentService.rebuildChunksFromFile(document.getId(), dest);

            DocumentInfo info = new DocumentInfo();
            info.setId(document.getId());
            info.setName(document.getName());
            info.setUploaderId(document.getUploaderId());
            return ApiResponse.ok("上传成功", info);
        } catch (IOException e) {
            if (dest != null && dest.exists()) {
                dest.delete();
            }
            if (document != null && document.getId() != null) {
                documentService.deleteById(document.getId());
            }
            return ApiResponse.fail("上传文件失败：" + e.getMessage());
        } catch (Exception e) {
            if (dest != null && dest.exists()) {
                dest.delete();
            }
            if (document != null && document.getId() != null) {
                documentService.deleteById(document.getId());
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
        String baseDir = System.getProperty("user.home") + File.separator + "study-ai-uploads";
        String stored = (document.getStoredFilename() != null && !document.getStoredFilename().trim().isEmpty())
                ? document.getStoredFilename()
                : id + "_" + document.getName();
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
        String baseDir = System.getProperty("user.home") + File.separator + "study-ai-uploads";
        String stored = (document.getStoredFilename() != null && !document.getStoredFilename().trim().isEmpty())
                ? document.getStoredFilename()
                : id + "_" + document.getName();
        File file = new File(baseDir, stored);
        if (file.exists()) {
            file.delete();
        }
        return ApiResponse.ok(null);
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
