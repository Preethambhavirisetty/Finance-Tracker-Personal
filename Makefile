.PHONY: help build up down restart logs status clean backup restore update

# Detect Docker Compose version
DOCKER_COMPOSE := $(shell docker compose version > /dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

# Default target
help:
	@echo "Finance Tracker - Docker Management Commands"
	@echo ""
	@echo "Detected: $(DOCKER_COMPOSE)"
	@echo ""
	@echo "Usage:"
	@echo "  make build          Build all Docker images"
	@echo "  make up             Start all services in detached mode"
	@echo "  make down           Stop and remove all containers"
	@echo "  make restart        Restart all services"
	@echo "  make logs           View logs from all services"
	@echo "  make status         Show status of all services"
	@echo "  make clean          Remove containers, networks, and volumes (⚠️  DELETES DATA)"
	@echo "  make backup         Create a manual database backup"
	@echo "  make restore        Restore database from latest backup"
	@echo "  make update         Pull latest code and rebuild"
	@echo "  make monitor        Show real-time resource usage"
	@echo ""
	@echo "Individual Service Commands:"
	@echo "  make logs-backend   View backend logs"
	@echo "  make logs-frontend  View frontend logs"
	@echo "  make logs-db        View database logs"
	@echo "  make shell-backend  Open shell in backend container"
	@echo "  make shell-db       Open PostgreSQL shell"

# Build all images
build:
	$(DOCKER_COMPOSE) build

# Start all services
up:
	$(DOCKER_COMPOSE) up -d
	@echo "Services started! Frontend: http://localhost | Backend: http://localhost:5001"

# Stop and remove containers
down:
	$(DOCKER_COMPOSE) down

# Restart all services
restart:
	$(DOCKER_COMPOSE) restart
	@echo "Services restarted!"

# View logs from all services
logs:
	$(DOCKER_COMPOSE) logs -f

# View logs from backend
logs-backend:
	$(DOCKER_COMPOSE) logs -f backend

# View logs from frontend
logs-frontend:
	$(DOCKER_COMPOSE) logs -f frontend

# View logs from database
logs-db:
	$(DOCKER_COMPOSE) logs -f db

# Show status of all services
status:
	$(DOCKER_COMPOSE) ps

# Clean up everything (⚠️ DELETES DATA)
clean:
	@echo "⚠️  WARNING: This will delete all data including database!"
	@read -p "Are you sure? Type 'yes' to continue: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		$(DOCKER_COMPOSE) down -v; \
		echo "Cleanup complete."; \
	else \
		echo "Cancelled."; \
	fi

# Create manual backup
backup:
	@mkdir -p backups
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	$(DOCKER_COMPOSE) exec -T db pg_dump -U financeuser finance_tracker > backups/manual_backup_$$TIMESTAMP.sql; \
	echo "Backup created: backups/manual_backup_$$TIMESTAMP.sql"

# Restore from latest backup
restore:
	@LATEST=$$(ls -t backups/*.sql 2>/dev/null | head -1); \
	if [ -z "$$LATEST" ]; then \
		echo "No backup files found!"; \
		exit 1; \
	fi; \
	echo "Restoring from $$LATEST..."; \
	$(DOCKER_COMPOSE) stop backend frontend; \
	cat $$LATEST | $(DOCKER_COMPOSE) exec -T db psql -U financeuser -d finance_tracker; \
	$(DOCKER_COMPOSE) start backend frontend; \
	echo "Restore complete!"

# Pull latest code and rebuild
update:
	git pull origin main
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) build
	$(DOCKER_COMPOSE) up -d
	@echo "Update complete!"

# Show real-time resource usage
monitor:
	docker stats

# Open shell in backend container
shell-backend:
	$(DOCKER_COMPOSE) exec backend /bin/sh

# Open PostgreSQL shell
shell-db:
	$(DOCKER_COMPOSE) exec db psql -U financeuser -d finance_tracker

# Check health of all services
health:
	@echo "Checking service health..."
	@echo "\nBackend API:"
	@curl -s http://localhost:5001/api/health || echo "Backend not responding"
	@echo "\n\nFrontend:"
	@curl -s http://localhost/health || echo "Frontend not responding"
	@echo "\n\nDatabase:"
	@$(DOCKER_COMPOSE) exec db pg_isready -U financeuser || echo "Database not responding"
	@echo "\n"

# Install/setup for first time
install:
	@if [ ! -f .env ]; then \
		echo "Creating .env file from template..."; \
		cp env.example .env; \
		echo "⚠️  Please edit .env file with your configuration!"; \
		echo "Generate SECRET_KEY with: python3 -c 'import secrets; print(secrets.token_hex(32))'"; \
	else \
		echo ".env file already exists."; \
	fi
	@mkdir -p backups
	@echo "Setup complete! Next steps:"
	@echo "1. Edit .env file with your configuration"
	@echo "2. Run 'make build' to build images"
	@echo "3. Run 'make up' to start services"

# Quick deploy (build and start)
deploy:
	$(DOCKER_COMPOSE) up -d --build
	@echo "Deployment complete!"
	@echo "Check status with: make status"

# Stop specific service
stop-%:
	$(DOCKER_COMPOSE) stop $*

# Start specific service
start-%:
	$(DOCKER_COMPOSE) start $*

# Rebuild specific service
rebuild-%:
	$(DOCKER_COMPOSE) stop $*
	$(DOCKER_COMPOSE) build $*
	$(DOCKER_COMPOSE) up -d $*
	@echo "Rebuilt and restarted $*"
