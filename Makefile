# Makefile để chạy các script backup/restore PostgreSQL

SCRIPTS_DIR := scripts

.PHONY: backup restore

backup:
	@echo "=== Running backup script ==="
	@bash $(SCRIPTS_DIR)/backup.sh

restore:
	@echo "=== Running restore script ==="
	@bash $(SCRIPTS_DIR)/restore.sh
