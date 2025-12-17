@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ============================================================
::  学业辅助平台 - 一键环境检测与部署脚本
::  适用于 Windows 11 系统
::  功能：检测 Java/Maven/MySQL/Redis，缺失则自动下载配置
:: ============================================================

title 学业辅助平台 - 环境检测与部署

:: 颜色定义
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "RESET=[0m"

:: 下载目录
set "DOWNLOAD_DIR=%~dp0downloads"
if not exist "%DOWNLOAD_DIR%" mkdir "%DOWNLOAD_DIR%"

:: 项目目录
set "PROJECT_DIR=%~dp0"

echo.
echo %CYAN%╔════════════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║        学业辅助平台 - 一键环境检测与部署脚本              ║%RESET%
echo %CYAN%╠════════════════════════════════════════════════════════════╣%RESET%
echo %CYAN%║  检测项目：Java 17+, Maven 3.6+, MySQL, Redis, 端口占用   ║%RESET%
echo %CYAN%╚════════════════════════════════════════════════════════════╝%RESET%
echo.

:: ============================================================
:: 第一步：检测管理员权限
:: ============================================================
echo %YELLOW%[1/6] 检测管理员权限...%RESET%
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[错误] 需要管理员权限运行此脚本！%RESET%
    echo %YELLOW%请右键点击此脚本，选择"以管理员身份运行"%RESET%
    pause
    exit /b 1
)
echo %GREEN%[√] 已获取管理员权限%RESET%
echo.

:: ============================================================
:: 第二步：检测 Java
:: ============================================================
echo %YELLOW%[2/6] 检测 Java 环境...%RESET%
set "JAVA_OK=0"
set "JAVA_VERSION="

where java >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=3" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do (
        set "JAVA_VERSION=%%~v"
    )
    :: 提取主版本号
    for /f "tokens=1 delims=." %%a in ("!JAVA_VERSION!") do (
        set "JAVA_MAJOR=%%a"
    )
    :: 检查是否 >= 17
    if !JAVA_MAJOR! geq 17 (
        set "JAVA_OK=1"
        echo %GREEN%[√] Java 已安装: 版本 !JAVA_VERSION!%RESET%
    ) else (
        echo %YELLOW%[!] Java 版本过低: !JAVA_VERSION! ^(需要 17+^)%RESET%
    )
) else (
    echo %YELLOW%[!] 未检测到 Java%RESET%
)

if !JAVA_OK! equ 0 (
    echo %CYAN%    正在下载 OpenJDK 17...%RESET%
    set "JDK_URL=https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_windows-x64_bin.zip"
    set "JDK_ZIP=%DOWNLOAD_DIR%\openjdk-17.zip"
    set "JDK_DIR=C:\Java\jdk-17"
    
    if not exist "!JDK_ZIP!" (
        powershell -Command "Invoke-WebRequest -Uri '!JDK_URL!' -OutFile '!JDK_ZIP!'" 2>nul
        if !errorLevel! neq 0 (
            echo %RED%    [错误] Java 下载失败，请手动安装 JDK 17+%RESET%
            echo %YELLOW%    下载地址: https://adoptium.net/zh-CN/temurin/releases/%RESET%
            goto :CHECK_MAVEN
        )
    )
    
    echo %CYAN%    正在解压 JDK...%RESET%
    if not exist "C:\Java" mkdir "C:\Java"
    powershell -Command "Expand-Archive -Path '!JDK_ZIP!' -DestinationPath 'C:\Java' -Force" 2>nul
    
    :: 重命名解压目录
    for /d %%d in (C:\Java\jdk-17*) do (
        if exist "!JDK_DIR!" rmdir /s /q "!JDK_DIR!"
        move "%%d" "!JDK_DIR!" >nul 2>&1
    )
    
    echo %CYAN%    正在配置 JAVA_HOME 环境变量...%RESET%
    setx JAVA_HOME "!JDK_DIR!" /M >nul 2>&1
    
    :: 添加到 PATH
    for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
    echo !SYS_PATH! | findstr /C:"!JDK_DIR!\bin" >nul
    if !errorLevel! neq 0 (
        setx Path "!SYS_PATH!;!JDK_DIR!\bin" /M >nul 2>&1
    )
    
    set "JAVA_HOME=!JDK_DIR!"
    set "PATH=!PATH!;!JDK_DIR!\bin"
    echo %GREEN%    [√] Java 17 安装完成: !JDK_DIR!%RESET%
)
echo.

:: ============================================================
:: 第三步：检测 Maven
:: ============================================================
:CHECK_MAVEN
echo %YELLOW%[3/6] 检测 Maven 环境...%RESET%
set "MAVEN_OK=0"

where mvn >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=3" %%v in ('mvn -version 2^>^&1 ^| findstr /i "Apache Maven"') do (
        set "MAVEN_VERSION=%%v"
    )
    echo %GREEN%[√] Maven 已安装: 版本 !MAVEN_VERSION!%RESET%
    set "MAVEN_OK=1"
) else (
    echo %YELLOW%[!] 未检测到 Maven%RESET%
)

if !MAVEN_OK! equ 0 (
    echo %CYAN%    正在下载 Maven 3.9.6...%RESET%
    set "MAVEN_URL=https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    set "MAVEN_ZIP=%DOWNLOAD_DIR%\maven-3.9.6.zip"
    set "MAVEN_DIR=C:\Maven\apache-maven-3.9.6"
    
    if not exist "!MAVEN_ZIP!" (
        powershell -Command "Invoke-WebRequest -Uri '!MAVEN_URL!' -OutFile '!MAVEN_ZIP!'" 2>nul
        if !errorLevel! neq 0 (
            echo %RED%    [错误] Maven 下载失败，请手动安装%RESET%
            echo %YELLOW%    下载地址: https://maven.apache.org/download.cgi%RESET%
            goto :CHECK_MYSQL
        )
    )
    
    echo %CYAN%    正在解压 Maven...%RESET%
    if not exist "C:\Maven" mkdir "C:\Maven"
    powershell -Command "Expand-Archive -Path '!MAVEN_ZIP!' -DestinationPath 'C:\Maven' -Force" 2>nul
    
    echo %CYAN%    正在配置 MAVEN_HOME 环境变量...%RESET%
    setx MAVEN_HOME "!MAVEN_DIR!" /M >nul 2>&1
    
    :: 添加到 PATH
    for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
    echo !SYS_PATH! | findstr /C:"!MAVEN_DIR!\bin" >nul
    if !errorLevel! neq 0 (
        setx Path "!SYS_PATH!;!MAVEN_DIR!\bin" /M >nul 2>&1
    )
    
    set "MAVEN_HOME=!MAVEN_DIR!"
    set "PATH=!PATH!;!MAVEN_DIR!\bin"
    echo %GREEN%    [√] Maven 3.9.6 安装完成: !MAVEN_DIR!%RESET%
)
echo.

:: ============================================================
:: 第四步：检测 MySQL
:: ============================================================
:CHECK_MYSQL
echo %YELLOW%[4/6] 检测 MySQL 环境...%RESET%
set "MYSQL_OK=0"

where mysql >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=3" %%v in ('mysql --version 2^>^&1') do (
        set "MYSQL_VERSION=%%v"
    )
    echo %GREEN%[√] MySQL 已安装: 版本 !MYSQL_VERSION!%RESET%
    set "MYSQL_OK=1"
) else (
    :: 检查常见安装路径
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        echo %GREEN%[√] MySQL 已安装 ^(路径: C:\Program Files\MySQL\MySQL Server 8.0^)%RESET%
        set "MYSQL_OK=1"
    ) else if exist "C:\xampp\mysql\bin\mysql.exe" (
        echo %GREEN%[√] MySQL 已安装 ^(XAMPP 环境^)%RESET%
        set "MYSQL_OK=1"
    )
)

if !MYSQL_OK! equ 0 (
    echo %RED%[!] 未检测到 MySQL%RESET%
    echo %YELLOW%    MySQL 需要手动安装，推荐以下方式：%RESET%
    echo %CYAN%    1. MySQL Installer: https://dev.mysql.com/downloads/installer/%RESET%
    echo %CYAN%    2. XAMPP ^(包含MySQL^): https://www.apachefriends.org/%RESET%
    echo %CYAN%    3. Docker: docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=1234 mysql:8%RESET%
    echo.
    echo %YELLOW%    安装后请创建数据库：%RESET%
    echo %CYAN%    CREATE DATABASE study_ai DEFAULT CHARACTER SET utf8mb4;%RESET%
    echo.
    set /p MYSQL_CONTINUE="    是否已安装 MySQL 并继续？(Y/N): "
    if /i "!MYSQL_CONTINUE!" neq "Y" (
        echo %YELLOW%    请先安装 MySQL 后再运行此脚本%RESET%
        pause
        exit /b 1
    )
)
echo.

:: ============================================================
:: 第五步：检测 Redis
:: ============================================================
:CHECK_REDIS
echo %YELLOW%[5/6] 检测 Redis 环境...%RESET%
set "REDIS_OK=0"

where redis-server >nul 2>&1
if %errorLevel% equ 0 (
    echo %GREEN%[√] Redis 已安装%RESET%
    set "REDIS_OK=1"
) else (
    :: 检查常见安装路径
    if exist "C:\Redis\redis-server.exe" (
        echo %GREEN%[√] Redis 已安装 ^(路径: C:\Redis^)%RESET%
        set "REDIS_OK=1"
        set "PATH=!PATH!;C:\Redis"
    )
)

if !REDIS_OK! equ 0 (
    echo %CYAN%    正在下载 Redis for Windows...%RESET%
    set "REDIS_URL=https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
    set "REDIS_ZIP=%DOWNLOAD_DIR%\redis-5.0.14.zip"
    set "REDIS_DIR=C:\Redis"
    
    if not exist "!REDIS_ZIP!" (
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!REDIS_URL!' -OutFile '!REDIS_ZIP!'" 2>nul
        if !errorLevel! neq 0 (
            echo %RED%    [错误] Redis 下载失败%RESET%
            echo %YELLOW%    请手动下载: https://github.com/tporadowski/redis/releases%RESET%
            goto :DEPLOY
        )
    )
    
    echo %CYAN%    正在解压 Redis...%RESET%
    if not exist "!REDIS_DIR!" mkdir "!REDIS_DIR!"
    powershell -Command "Expand-Archive -Path '!REDIS_ZIP!' -DestinationPath '!REDIS_DIR!' -Force" 2>nul
    
    :: 移动文件到根目录
    for /d %%d in (!REDIS_DIR!\Redis*) do (
        xcopy "%%d\*" "!REDIS_DIR!\" /E /Y >nul 2>&1
        rmdir /s /q "%%d" 2>nul
    )
    
    :: 添加到 PATH
    for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
    echo !SYS_PATH! | findstr /C:"!REDIS_DIR!" >nul
    if !errorLevel! neq 0 (
        setx Path "!SYS_PATH!;!REDIS_DIR!" /M >nul 2>&1
    )
    
    set "PATH=!PATH!;!REDIS_DIR!"
    echo %GREEN%    [√] Redis 5.0.14 安装完成: !REDIS_DIR!%RESET%
    
    :: 注册为 Windows 服务
    echo %CYAN%    正在注册 Redis 为 Windows 服务...%RESET%
    "!REDIS_DIR!\redis-server.exe" --service-install "!REDIS_DIR!\redis.windows.conf" --loglevel verbose >nul 2>&1
    echo %GREEN%    [√] Redis 服务已注册%RESET%
)
echo.

:: ============================================================
:: 第六步：检测端口占用
:: ============================================================
:CHECK_PORT
echo %YELLOW%[6/7] 检测端口占用情况...%RESET%

:: 检测 8081 端口（Jetty）
echo %CYAN%    检测 8081 端口（项目服务）...%RESET%
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING 2^>nul') do (
    set "PORT_8081_PID=%%a"
)
if defined PORT_8081_PID (
    echo %YELLOW%    [!] 端口 8081 被进程 PID=!PORT_8081_PID! 占用%RESET%
    set /p KILL_8081="    是否终止该进程？(Y/N): "
    if /i "!KILL_8081!" equ "Y" (
        taskkill /F /PID !PORT_8081_PID! >nul 2>&1
        if !errorLevel! equ 0 (
            echo %GREEN%    [√] 进程 !PORT_8081_PID! 已终止%RESET%
        ) else (
            echo %RED%    [错误] 无法终止进程，请手动处理%RESET%
        )
    )
) else (
    echo %GREEN%    [√] 端口 8081 可用%RESET%
)

:: 检测 3306 端口（MySQL）
echo %CYAN%    检测 3306 端口（MySQL）...%RESET%
set "PORT_3306_OK=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3306 ^| findstr LISTENING 2^>nul') do (
    set "PORT_3306_OK=1"
)
if !PORT_3306_OK! equ 1 (
    echo %GREEN%    [√] MySQL 端口 3306 正在监听%RESET%
) else (
    echo %YELLOW%    [!] MySQL 端口 3306 未监听，请确保 MySQL 已启动%RESET%
)

:: 检测 6379 端口（Redis）
echo %CYAN%    检测 6379 端口（Redis）...%RESET%
set "PORT_6379_OK=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :6379 ^| findstr LISTENING 2^>nul') do (
    set "PORT_6379_OK=1"
)
if !PORT_6379_OK! equ 1 (
    echo %GREEN%    [√] Redis 端口 6379 正在监听%RESET%
) else (
    echo %YELLOW%    [!] Redis 端口 6379 未监听，将尝试启动 Redis%RESET%
)
echo.

:: ============================================================
:: 第七步：启动服务并部署项目
:: ============================================================
:DEPLOY
echo %YELLOW%[7/7] 启动服务并部署项目...%RESET%
echo.

:: 启动 Redis
echo %CYAN%    检查 Redis 服务状态...%RESET%
sc query Redis >nul 2>&1
if %errorLevel% equ 0 (
    sc query Redis | findstr "RUNNING" >nul
    if !errorLevel! neq 0 (
        echo %CYAN%    正在启动 Redis 服务...%RESET%
        net start Redis >nul 2>&1
    )
    echo %GREEN%    [√] Redis 服务运行中%RESET%
) else (
    :: 直接启动 Redis
    if exist "C:\Redis\redis-server.exe" (
        echo %CYAN%    正在后台启动 Redis...%RESET%
        start /B "" "C:\Redis\redis-server.exe" "C:\Redis\redis.windows.conf" >nul 2>&1
        timeout /t 2 >nul
        echo %GREEN%    [√] Redis 已启动%RESET%
    )
)

:: 检查 MySQL 服务
echo %CYAN%    检查 MySQL 服务状态...%RESET%
sc query MySQL >nul 2>&1
if %errorLevel% equ 0 (
    sc query MySQL | findstr "RUNNING" >nul
    if !errorLevel! neq 0 (
        echo %CYAN%    正在启动 MySQL 服务...%RESET%
        net start MySQL >nul 2>&1
    )
    echo %GREEN%    [√] MySQL 服务运行中%RESET%
) else (
    sc query MySQL80 >nul 2>&1
    if !errorLevel! equ 0 (
        sc query MySQL80 | findstr "RUNNING" >nul
        if !errorLevel! neq 0 (
            net start MySQL80 >nul 2>&1
        )
        echo %GREEN%    [√] MySQL80 服务运行中%RESET%
    ) else (
        echo %YELLOW%    [!] 未找到 MySQL 服务，请确保 MySQL 已启动%RESET%
    )
)

echo.
echo %CYAN%════════════════════════════════════════════════════════════%RESET%
echo %GREEN%  环境检测完成！%RESET%
echo %CYAN%════════════════════════════════════════════════════════════%RESET%
echo.

:: 显示环境摘要
echo %YELLOW%环境摘要：%RESET%
echo   JAVA_HOME  = %JAVA_HOME%
echo   MAVEN_HOME = %MAVEN_HOME%
echo   项目目录   = %PROJECT_DIR%
echo.

:: 询问是否初始化数据库
set /p INIT_DB="是否需要初始化数据库？(首次运行请选Y) (Y/N): "
if /i "!INIT_DB!" equ "Y" (
    echo.
    echo %CYAN%正在初始化数据库...%RESET%
    echo %YELLOW%请输入 MySQL root 密码：%RESET%
    set /p MYSQL_PWD="密码: "
    
    :: 创建数据库
    mysql -u root -p!MYSQL_PWD! -e "CREATE DATABASE IF NOT EXISTS study_ai DEFAULT CHARACTER SET utf8mb4;" 2>nul
    if !errorLevel! equ 0 (
        echo %GREEN%[√] 数据库 study_ai 创建成功%RESET%
        
        :: 执行建表脚本
        if exist "%PROJECT_DIR%src\main\resources\sql\schema.sql" (
            mysql -u root -p!MYSQL_PWD! study_ai < "%PROJECT_DIR%src\main\resources\sql\schema.sql" 2>nul
            echo %GREEN%[√] 数据表初始化完成%RESET%
        )
    ) else (
        echo %RED%[错误] 数据库初始化失败，请检查 MySQL 连接%RESET%
    )
)

echo.
set /p START_PROJECT="是否立即启动项目？(Y/N): "
if /i "!START_PROJECT!" equ "Y" (
    echo.
    
    :: 再次检查 8081 端口
    echo %CYAN%正在检查端口 8081...%RESET%
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING 2^>nul') do (
        set "FINAL_PORT_PID=%%a"
    )
    if defined FINAL_PORT_PID (
        echo %YELLOW%[!] 端口 8081 仍被占用，正在自动清理...%RESET%
        taskkill /F /PID !FINAL_PORT_PID! >nul 2>&1
        timeout /t 2 >nul
        echo %GREEN%[√] 端口已清理%RESET%
    )
    
    echo.
    echo %CYAN%════════════════════════════════════════════════════════════%RESET%
    echo %GREEN%  正在启动项目...%RESET%
    echo %CYAN%════════════════════════════════════════════════════════════%RESET%
    echo.
    echo %YELLOW%项目启动后请访问：%RESET%
    echo %GREEN%  http://localhost:8081/ssm-spring-ai-study%RESET%
    echo.
    echo %YELLOW%按 Ctrl+C 可停止项目%RESET%
    echo.
    
    cd /d "%PROJECT_DIR%"
    call mvn jetty:run
) else (
    echo.
    echo %YELLOW%您可以稍后通过以下命令启动项目：%RESET%
    echo %CYAN%  cd "%PROJECT_DIR%"%RESET%
    echo %CYAN%  mvn jetty:run%RESET%
    echo.
    echo %YELLOW%项目启动后请访问：%RESET%
    echo %GREEN%  http://localhost:8081/ssm-spring-ai-study%RESET%
)

echo.
pause
