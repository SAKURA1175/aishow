package com.xxzd.study.service.impl;

import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import com.xxzd.study.domain.Document;
import com.xxzd.study.domain.DocumentChunk;
import com.xxzd.study.domain.User;
import com.xxzd.study.mapper.DocumentChunkMapper;
import com.xxzd.study.mapper.DocumentMapper;
import com.xxzd.study.service.DocumentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;

@Service
public class DocumentServiceImpl implements DocumentService {

    @Resource
    private DocumentMapper documentMapper;

    @Resource
    private DocumentChunkMapper documentChunkMapper;

    @Override
    @Transactional
    public Document saveDocument(String originalFilename, User uploader) {
        Document document = new Document();
        document.setName(originalFilename);
        document.setUploaderId(uploader.getId());
        document.setStoredFilename("");
        documentMapper.insert(document);
        return document;
    }

    @Override
    public java.util.List<Document> listAll() {
        return documentMapper.selectAllOrderByTime();
    }

    @Override
    public Document findById(Long id) {
        return documentMapper.selectById(id);
    }

    @Override
    @Transactional
    public boolean deleteById(Long id) {
        if (id == null) {
            return false;
        }
        documentChunkMapper.deleteByDocumentId(id);
        int rows = documentMapper.deleteById(id);
        return rows > 0;
    }

    @Override
    @Transactional
    public void updateStoredFilename(Long id, String storedFilename) {
        if (id == null) {
            throw new IllegalArgumentException("id 不能为空");
        }
        if (storedFilename == null) {
            storedFilename = "";
        }
        documentMapper.updateStoredFilename(id, storedFilename);
    }

    @Override
    @Transactional
    public void rebuildChunksFromFile(Long documentId, File file) {
        if (documentId == null) {
            throw new IllegalArgumentException("documentId 不能为空");
        }
        if (file == null || !file.exists() || !file.isFile()) {
            throw new IllegalArgumentException("文件不存在");
        }

        Document document = documentMapper.selectById(documentId);
        if (document == null) {
            throw new IllegalArgumentException("文档不存在");
        }

        String extracted = extractText(file, document.getName());
        if (extracted == null || extracted.trim().isEmpty()) {
            throw new IllegalStateException("文档解析结果为空");
        }

        List<String> chunks = splitToChunks(extracted, 800, 100);
        if (chunks.isEmpty()) {
            throw new IllegalStateException("文档切分结果为空");
        }

        documentChunkMapper.deleteByDocumentId(documentId);

        List<DocumentChunk> insertList = new ArrayList<>(chunks.size());
        for (int i = 0; i < chunks.size(); i++) {
            DocumentChunk c = new DocumentChunk();
            c.setDocumentId(documentId);
            c.setChunkIndex(i);
            c.setContent(chunks.get(i));
            insertList.add(c);
        }
        documentChunkMapper.insertBatch(insertList);
    }

    private String extractText(File file, String filename) {
        String name = filename == null ? "" : filename.trim();
        String lower = name.toLowerCase();
        if (lower.endsWith(".txt")) {
            return readTxt(file);
        }
        if (lower.endsWith(".pdf")) {
            return readPdf(file);
        }
        if (lower.endsWith(".docx")) {
            return readDocx(file);
        }
        if (lower.endsWith(".doc")) {
            return readDoc(file);
        }
        throw new IllegalArgumentException("不支持的文件类型：" + name);
    }

    private String readTxt(File file) {
        try {
            return Files.readString(file.toPath(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            try {
                return Files.readString(file.toPath(), java.nio.charset.Charset.forName("GBK"));
            } catch (Exception ex) {
                try {
                return Files.readString(file.toPath(), StandardCharsets.ISO_8859_1);
                } catch (Exception ex2) {
                    throw new IllegalStateException("TXT 读取失败：" + ex2.getMessage(), ex2);
                }
            }
        }
    }

    private String readPdf(File file) {
        try (PDDocument doc = PDDocument.load(file)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (Exception e) {
            throw new IllegalStateException("PDF 解析失败：" + e.getMessage(), e);
        }
    }

    private String readDocx(File file) {
        try (FileInputStream fis = new FileInputStream(file);
             XWPFDocument doc = new XWPFDocument(fis);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        } catch (Exception e) {
            throw new IllegalStateException("DOCX 解析失败：" + e.getMessage(), e);
        }
    }

    private String readDoc(File file) {
        try (FileInputStream fis = new FileInputStream(file);
             HWPFDocument doc = new HWPFDocument(fis);
             WordExtractor extractor = new WordExtractor(doc)) {
            return extractor.getText();
        } catch (Exception e) {
            throw new IllegalStateException("DOC 解析失败：" + e.getMessage(), e);
        }
    }

    private List<String> splitToChunks(String text, int chunkSize, int overlap) {
        String normalized = normalizeText(text);
        List<String> chunks = new ArrayList<>();
        if (normalized.isEmpty()) {
            return chunks;
        }

        int size = Math.max(200, chunkSize);
        int ov = Math.max(0, Math.min(overlap, size / 2));

        int start = 0;
        while (start < normalized.length()) {
            int end = Math.min(start + size, normalized.length());
            String part = normalized.substring(start, end).trim();
            if (!part.isEmpty()) {
                chunks.add(part);
            }
            if (end >= normalized.length()) {
                break;
            }
            start = Math.max(0, end - ov);
        }
        return chunks;
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        String t = text.replace("\u0000", " ");
        t = t.replaceAll("[\r\t]+", " ");
        t = t.replaceAll("\n{3,}", "\n\n");
        return t.trim();
    }
}
