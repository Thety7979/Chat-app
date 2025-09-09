@echo off
REM ========================================
REM Backup PostgreSQL database with timestamp
REM ========================================

set PGPASSWORD=1234567890
set DB_NAME=chat_app

REM Lấy timestamp: YYYY-MM-DD_HHMMSS
for /f %%i in ('powershell -Command "Get-Date -Format yyyy-MM-dd_HHmmss"') do set TIMESTAMP=%%i

REM Đường dẫn thư mục backup (chạy từ thư mục scripts)
set BACKUP_DIR=%~dp0..\backups

REM Tạo file backup trong thư mục backups
set FILE_NAME=backup_%DB_NAME%_%TIMESTAMP%.sql
pg_dump -U postgres -h localhost -p 5432 -d %DB_NAME% -f "%BACKUP_DIR%\%FILE_NAME%"

echo Backup completed! File created: %BACKUP_DIR%\%FILE_NAME%
pause
