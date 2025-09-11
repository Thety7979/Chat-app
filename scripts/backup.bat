@echo off

set PGPASSWORD=1234567890
set DB_NAME=chat_app

for /f %%i in ('powershell -Command "Get-Date -Format yyyy-MM-dd_HHmmss"') do set TIMESTAMP=%%i

set BACKUP_DIR=%~dp0..\backups

set FILE_NAME=backup_%DB_NAME%_%TIMESTAMP%.sql
pg_dump -U postgres -h localhost -p 5432 -d %DB_NAME% -f "%BACKUP_DIR%\%FILE_NAME%"

echo Backup completed! File created: %BACKUP_DIR%\%FILE_NAME%
pause
