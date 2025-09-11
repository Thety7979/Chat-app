@echo off

setlocal enabledelayedexpansion

set PGPASSWORD=1234567890
set DB_NAME=chat_app

set BACKUP_DIR=%~dp0..\backups

psql -U postgres -h localhost -p 5432 -d postgres -c "ALTER DATABASE template1 REFRESH COLLATION VERSION;" >nul 2>&1
psql -U postgres -h localhost -p 5432 -d postgres -c "ALTER DATABASE postgres REFRESH COLLATION VERSION;" >nul 2>&1

for /f "delims=" %%i in ('dir "%BACKUP_DIR%\backup_%DB_NAME%_*.sql" /b /o:-d') do (
    set LATEST_BACKUP=%%i
    goto found
)

:found
if not defined LATEST_BACKUP (
    echo No backup file found for %DB_NAME% in %BACKUP_DIR%.
    pause
    exit /b
)

echo Using backup file: %BACKUP_DIR%\!LATEST_BACKUP!

psql -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='!DB_NAME!';" | findstr "1" >nul

IF !ERRORLEVEL! EQU 0 (
    echo Database "!DB_NAME!" exists. Terminating active connections...
    psql -U postgres -h localhost -p 5432 -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='!DB_NAME!' AND pid <> pg_backend_pid();" >nul 2>&1

    echo Dropping database "!DB_NAME!"...
    dropdb -U postgres -h localhost -p 5432 !DB_NAME!
    echo Database replaced: !DB_NAME!
) ELSE (
    echo Database does not exist. Creating new database "!DB_NAME!"...
)

createdb -U postgres -h localhost -p 5432 !DB_NAME!

psql -U postgres -h localhost -p 5432 -d !DB_NAME! -f "%BACKUP_DIR%\!LATEST_BACKUP!"

echo Restore completed! Database: !DB_NAME! from file %BACKUP_DIR%\!LATEST_BACKUP!
pause
endlocal
