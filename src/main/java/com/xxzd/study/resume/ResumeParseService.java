package com.xxzd.study.resume;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

/**
 * 简历文件解析服务
 * 支持 PDF / DOCX / TXT，提取纯文本供后续 AI 分析
 */
@Service
public class ResumeParseService {

    /**
     * 从上传的文件中提取纯文本
     */
    public String extractText(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename();
        if (filename == null) filename = "";
        String lower = filename.toLowerCase();

        if (lower.endsWith(".pdf")) {
            return extractPdf(file.getInputStream());
        } else if (lower.endsWith(".docx")) {
            return extractDocx(file.getInputStream());
        } else if (lower.endsWith(".txt")) {
            return new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
        } else {
            throw new IllegalArgumentException("不支持的文件类型，请上传 PDF、DOCX 或 TXT 格式的简历");
        }
    }

    /**
     * 推断文件类型
     */
    public String detectFileType(String filename) {
        if (filename == null) return "txt";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf"))  return "pdf";
        if (lower.endsWith(".docx")) return "docx";
        return "txt";
    }

    // ── 私有实现 ──────────────────────────────────────────────────────────────

    private String extractPdf(InputStream inputStream) throws Exception {
        try (PDDocument doc = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(doc);
            return text == null ? "" : text.trim();
        }
    }

    private String extractDocx(InputStream inputStream) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(inputStream)) {
            List<XWPFParagraph> paragraphs = doc.getParagraphs();
            StringBuilder sb = new StringBuilder();
            for (XWPFParagraph para : paragraphs) {
                String text = para.getText();
                if (text != null && !text.isBlank()) {
                    sb.append(text).append("\n");
                }
            }
            return sb.toString().trim();
        }
    }
}
