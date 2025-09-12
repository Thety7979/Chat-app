export PGPASSWORD="1234567890"
DB_NAME="chat_app"

BACKUP_DIR="$(dirname "$0")/../backups"

psql -U postgres -h localhost -p 5432 -d postgres -c "ALTER DATABASE template1 REFRESH COLLATION VERSION;" >/dev/null 2>&1
psql -U postgres -h localhost -p 5432 -d postgres -c "ALTER DATABASE postgres REFRESH COLLATION VERSION;" >/dev/null 2>&1

LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_"$DB_NAME"_*.sql 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "No backup file found for $DB_NAME in $BACKUP_DIR."
  exit 1
fi

echo "Using backup file: $LATEST_BACKUP"

DB_EXISTS=$(psql -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';")

if [ "$DB_EXISTS" = "1" ]; then
  echo "Database '$DB_NAME' exists. Terminating active connections..."

  psql -U postgres -h localhost -p 5432 -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" >/dev/null 2>&1

  echo "Dropping database '$DB_NAME'..."
  dropdb -U postgres -h localhost -p 5432 "$DB_NAME"
  echo "Database replaced: $DB_NAME"
else
  echo "Database does not exist. Creating new database '$DB_NAME'..."
fi

createdb -U postgres -h localhost -p 5432 "$DB_NAME"

psql -U postgres -h localhost -p 5432 -d "$DB_NAME" -f "$LATEST_BACKUP"

echo "Restore completed! Database: $DB_NAME from file $LATEST_BACKUP"
