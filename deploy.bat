@echo off
chcp 65001 >nul
setlocal

echo ==========================================================
echo       学业辅助平台 - 本地启动脚本
echo ==========================================================

:: 1. 检查 Java 环境
where java >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 未检测到 Java，请先安装 JDK 17+。
    pause
    exit /b 1
)

:: 2. 输入 API Key
echo.
echo 请输入您的阿里云 DashScope API Key (用于 AI 模型调用)
echo 如果不输入，将尝试读取系统环境变量 AI_DASHSCOPE_API_KEY
set /p API_KEY="请输入 Key (直接回车跳过): "

if not "%API_KEY%"=="" (
    set "AI_DASHSCOPE_API_KEY=%API_KEY%"
)

if "%AI_DASHSCOPE_API_KEY%"=="" (
    echo [警告] 未设置 API Key，AI 功能可能无法使用。
)

:: 3. 启动应用
echo.
echo 正在清理并启动应用...
echo 访问地址: http://localhost:8081
echo.

call mvn clean spring-boot:run -Dspring-boot.run.jvmArguments="-Dfile.encoding=UTF-8"

if %errorLevel% neq 0 (
    echo.
    echo [错误] 启动失败，请检查上方错误日志。
    pause
    exit /b 1
)

pause
