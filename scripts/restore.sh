#!/bin/bash
# ========================================
# Restore PostgreSQL database from latest backup
# ========================================

set -e

export PGPASSWORD="1234567890"
DB_NAME="chat_app"

# Thư mục backups
BACKUP_DIR="$(dirname "$0")/../backups"

# Tìm file backup mới nhất
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_${DB_NAME}_*.sql 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "No backup file found for $DB_NAME in $BACKUP_DIR."
  exit 1
fi

echo "Using backup file: $LATEST_BACKUP"

# Refresh collation version
psql -U postgres -h localhost -p 5432 -d postgres -c "ALTER DATABASE template1 REFRESH COLLATION VERSION;" >/dev/null 2>&1 || true
psql -U postgres -h localhost -p 5432 -d postgres -c "ALTER DATABASE postgres REFRESH COLLATION VERSION;" >/dev/null 2>&1 || true

# Kiểm tra database có tồn tại không
if psql -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';" | grep -q 1; then
  echo "Database \"$DB_NAME\" exists. Terminating active connections..."
  psql -U postgres -h localhost -p 5432 -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" >/dev/null 2>&1

  echo "Dropping database \"$DB_NAME\"..."
  dropdb -U postgres -h localhost -p 5432 "$DB_NAME"
  echo "Database replaced: $DB_NAME"
else
  echo "Database does not exist. Creating new database \"$DB_NAME\"..."
fi

# Tạo lại database
createdb -U postgres -h localhost -p 5432 "$DB_NAME"

# Restore dữ liệu
psql -U postgres -h localhost -p 5432 -d "$DB_NAME" -f "$LATEST_BACKUP"

echo "Restore completed! Database: $DB_NAME from file $LATEST_BACKUP"
