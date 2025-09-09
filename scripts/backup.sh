#!/bin/bash
# ========================================
# Backup PostgreSQL database with timestamp
# ========================================

set -e

export PGPASSWORD="1234567890"
DB_NAME="chat_app"

# Thư mục backups (tính từ project root)
BACKUP_DIR="$(dirname "$0")/../backups"

# Tạo thư mục nếu chưa có
mkdir -p "$BACKUP_DIR"

# Tạo timestamp: YYYY-MM-DD_HHMMSS
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")

# Tạo file backup
FILE_NAME="backup_${DB_NAME}_${TIMESTAMP}.sql"
pg_dump -U postgres -h localhost -p 5432 -d "$DB_NAME" -f "$BACKUP_DIR/$FILE_NAME"

echo "Backup completed! File created: $BACKUP_DIR/$FILE_NAME"
