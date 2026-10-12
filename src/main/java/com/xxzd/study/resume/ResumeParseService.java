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
        byte[] bytes = inputStream.readAllBytes();
        StringBuilder sb = new StringBuilder();

        // 1. 优先尝试标准 Apache POI XWPF 提取段落与表格
        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes);
             XWPFDocument doc = new XWPFDocument(bais)) {
            for (XWPFParagraph para : doc.getParagraphs()) {
                String text = para.getText();
                if (text != null && !text.isBlank()) {
                    sb.append(text.trim()).append("\n");
                }
            }
            // 提取所有表格内容
            for (org.apache.poi.xwpf.usermodel.XWPFTable table : doc.getTables()) {
                for (org.apache.poi.xwpf.usermodel.XWPFTableRow row : table.getRows()) {
                    for (org.apache.poi.xwpf.usermodel.XWPFTableCell cell : row.getTableCells()) {
                        String cellText = cell.getText();
                        if (cellText != null && !cellText.isBlank()) {
                            sb.append(cellText.trim()).append("\n");
                        }
                    }
                }
            }
        } catch (Exception e) {
            // POI 读取若有警告继续降级到 XML 扫描
        }

        // 2. 若通过段落与表格提取的字数较少（例如大量文字放在 WPS 文本框、绘图画布或图形中），从 word/document.xml 直接提取所有 <w:t>
        if (sb.toString().trim().length() < 50) {
            try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes);
                 java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(bais)) {
                java.util.zip.ZipEntry entry;
                StringBuilder xmlSb = new StringBuilder();
                while ((entry = zis.getNextEntry()) != null) {
                    if ("word/document.xml".equalsIgnoreCase(entry.getName()) ||
                        (entry.getName().startsWith("word/header") && entry.getName().endsWith(".xml")) ||
                        (entry.getName().startsWith("word/footer") && entry.getName().endsWith(".xml"))) {
                        byte[] xmlBytes = zis.readAllBytes();
                        String xmlStr = new String(xmlBytes, java.nio.charset.StandardCharsets.UTF_8);
                        // 匹配所有 <w:t ...>文本</w:t> 或 <w:t>文本</w:t>
                        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("<w:t(?:\\s+[^>]*)?>([^<]+)</w:t>");
                        java.util.regex.Matcher matcher = pattern.matcher(xmlStr);
                        while (matcher.find()) {
                            String t = matcher.group(1).trim();
                            // 排除单纯的数字坐标（如 1419225 等 WPS 排版参数）
                            if (!t.isEmpty() && !t.matches("^-?\\d{5,}$")) {
                                xmlSb.append(t).append("\n");
                            }
                        }
                    }
                }
                if (xmlSb.toString().trim().length() > sb.toString().trim().length()) {
                    return xmlSb.toString().trim();
                }
            } catch (Exception ignored) {}
        }

        return sb.toString().trim();
    }
}
