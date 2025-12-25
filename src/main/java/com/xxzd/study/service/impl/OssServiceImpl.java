package com.xxzd.study.service.impl;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.PutObjectRequest;
import com.xxzd.study.config.properties.OssProperties;
import com.xxzd.study.service.OssService;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URL;
import java.util.Date;

@Service
public class OssServiceImpl implements OssService {

    @Resource
    private OssProperties ossProperties;

    private OSS getOssClient() {
        if (ossProperties.getAccessKeyId() == null || ossProperties.getAccessKeyId().contains("your-access-key-id")) {
            throw new IllegalArgumentException("阿里云OSS未配置，请检查 application.yml 中的 access-key-id 配置");
        }
        return new OSSClientBuilder().build(
                ossProperties.getEndpoint(),
                ossProperties.getAccessKeyId(),
                ossProperties.getAccessKeySecret());
    }

    @Override
    public String upload(String objectName, InputStream inputStream) {
        OSS ossClient = getOssClient();
        try {
            PutObjectRequest putObjectRequest = new PutObjectRequest(ossProperties.getBucketName(), objectName, inputStream);
            ossClient.putObject(putObjectRequest);
            // 这里返回的是不带签名的基础URL，或者可以返回objectName供后续生成签名URL
            // 为了简单起见，这里返回 objectName，实际访问时建议生成签名URL
            return objectName;
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }

    @Override
    public void delete(String objectName) {
        OSS ossClient = getOssClient();
        try {
            ossClient.deleteObject(ossProperties.getBucketName(), objectName);
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }

    @Override
    public String getUrl(String objectName) {
        OSS ossClient = getOssClient();
        try {
            // 设置URL过期时间为1小时
            Date expiration = new Date(new Date().getTime() + 3600 * 1000);
            URL url = ossClient.generatePresignedUrl(ossProperties.getBucketName(), objectName, expiration);
            return url.toString();
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }
}
