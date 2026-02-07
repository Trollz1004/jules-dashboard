# DateApp Docker Makefile
# Usage: make <target>

.PHONY: help build up down restart logs ps clean prune shell db-shell redis-shell backup restore

# Default target
help:
	@echo "DateApp Docker Commands"
	@echo "========================"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start all services in development mode"
	@echo "  make dev-build    - Rebuild and start in development mode"
	@echo "  make dev-logs     - View development logs"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start all services in production mode"
	@echo "  make prod-build   - Rebuild and start in production mode"
	@echo ""
	@echo "General:"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make build        - Build all images"
	@echo "  make logs         - View all logs"
	@echo "  make ps           - List running containers"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell     - Open PostgreSQL shell"
	@echo "  make db-backup    - Backup database"
	@echo "  make db-restore   - Restore database (requires BACKUP_FILE)"
	@echo "  make db-migrate   - Run database migrations"
	@echo ""
	@echo "Redis:"
	@echo "  make redis-shell  - Open Redis CLI"
	@echo "  make redis-flush  - Flush Redis cache"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Remove stopped containers"
	@echo "  make prune        - Remove unused Docker resources"
	@echo "  make shell        - Open shell in backend container"

# Development
dev:
	docker-compose up

dev-build:
	docker-compose up --build

dev-logs:
	docker-compose logs -f

# Production (without override file)
prod:
	docker-compose -f docker-compose.yml up -d

prod-build:
	docker-compose -f docker-compose.yml up -d --build

# General commands
up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

build:
	docker-compose build

logs:
	docker-compose logs -f

ps:
	docker-compose ps

# Service-specific logs
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-nginx:
	docker-compose logs -f nginx

logs-postgres:
	docker-compose logs -f postgres

logs-redis:
	docker-compose logs -f redis

logs-ollama:
	docker-compose logs -f ollama

# Database operations
db-shell:
	docker-compose exec postgres psql -U $${POSTGRES_USER:-dateapp} -d $${POSTGRES_DB:-dateapp}

db-backup:
	@mkdir -p ./backups
	docker-compose exec postgres pg_dump -U $${POSTGRES_USER:-dateapp} $${POSTGRES_DB:-dateapp} > ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in ./backups/"

db-restore:
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Usage: make db-restore BACKUP_FILE=./backups/backup.sql"; exit 1; fi
	docker-compose exec -T postgres psql -U $${POSTGRES_USER:-dateapp} -d $${POSTGRES_DB:-dateapp} < $(BACKUP_FILE)
	@echo "Database restored from $(BACKUP_FILE)"

db-migrate:
	docker-compose exec backend npx prisma migrate deploy

db-seed:
	docker-compose exec backend npx prisma db seed

# Redis operations
redis-shell:
	docker-compose exec redis redis-cli -a $${REDIS_PASSWORD}

redis-flush:
	docker-compose exec redis redis-cli -a $${REDIS_PASSWORD} FLUSHALL
	@echo "Redis cache flushed"

# Shell access
shell:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

# Ollama operations
ollama-pull:
	docker-compose exec ollama ollama pull $${OLLAMA_MODEL:-llama3.2}

ollama-list:
	docker-compose exec ollama ollama list

# Cleanup
clean:
	docker-compose down --remove-orphans
	docker container prune -f

prune:
	docker system prune -f
	docker volume prune -f

# Full reset (DANGEROUS - removes all data)
reset:
	@echo "WARNING: This will delete all data including the database!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down -v --remove-orphans
	docker system prune -f

# Health check
health:
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "Backend health:"
	@curl -s http://localhost:3001/health || echo "Backend not responding"
	@echo ""
	@echo "Frontend health:"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend OK" || echo "Frontend not responding"
	@echo ""
	@echo "Nginx health:"
	@curl -s http://localhost/nginx-health || echo "Nginx not responding"
