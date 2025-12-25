package com.xxzd.study.service;

import java.io.File;

import com.xxzd.study.domain.Document;
import com.xxzd.study.domain.User;

public interface DocumentService {

    Document saveDocument(String originalFilename, User uploader);

    java.util.List<Document> listAll();

    Document findById(Long id);

    boolean deleteById(Long id);

    void updateStoredFilename(Long id, String storedFilename);

    void rebuildChunks(Long documentId, java.io.InputStream inputStream, String filename);
}
