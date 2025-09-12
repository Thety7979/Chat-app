export PGPASSWORD="1234567890"
DB_NAME="chat_app"

TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")

BACKUP_DIR="$(dirname "$0")/../backups"

FILE_NAME="backup_${DB_NAME}_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

pg_dump -U postgres -h localhost -p 5432 -d "$DB_NAME" -f "$BACKUP_DIR/$FILE_NAME"

echo "Backup completed! File created: $BACKUP_DIR/$FILE_NAME"
