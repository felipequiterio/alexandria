.PHONY: setup dev dev-frontend dev-backend db-push db-studio db-migrate docker-up docker-down docker-reset logs clean

# First-time setup: docker + install + schema
setup: docker-up
	bun install
	@echo "Waiting for PostgreSQL..."
	@sleep 2
	docker exec alexandria-postgres-1 psql -U alexandria -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || true
	$(MAKE) db-push
	@echo "Ready! Run 'make dev' to start."

# Start everything
dev: docker-up
	bun run dev

dev-frontend:
	cd frontend && bun run dev

dev-backend:
	cd backend && bun run dev

# Database
db-push:
	cd backend && bunx drizzle-kit push

db-studio:
	cd backend && bunx drizzle-kit studio

db-migrate:
	cd backend && bunx drizzle-kit generate

db-shell:
	docker exec -it alexandria-postgres-1 psql -U alexandria

# Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-reset:
	docker compose down -v
	$(MAKE) setup

# Logs
logs:
	docker compose logs -f

# Build
build:
	cd frontend && bun run build

# Cleanup
clean:
	rm -rf node_modules frontend/node_modules backend/node_modules frontend/.next
