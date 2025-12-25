package com.xxzd.study.service;

import java.io.InputStream;

public interface OssService {

    /**
     * 上传文件
     * @param objectName OSS上的文件名
     * @param inputStream 文件流
     * @return 文件的访问URL
     */
    String upload(String objectName, InputStream inputStream);

    /**
     * 删除文件
     * @param objectName OSS上的文件名
     */
    void delete(String objectName);

    /**
     * 获取文件访问URL（带签名）
     * @param objectName OSS上的文件名
     * @return 签名URL
     */
    String getUrl(String objectName);
}
