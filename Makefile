.PHONY: dev db backend frontend down

# Lance Postgres (si pas déjà démarré), puis le backend et le frontend ensemble.
# Ctrl+C arrête les deux.
dev: db
	@trap 'kill 0' INT TERM; \
	(cd backend && npx tsx src/server.ts) & \
	(cd frontend && npm run dev) & \
	wait

db:
	docker compose up -d postgres

backend: db
	cd backend && npx tsx src/server.ts

frontend:
	cd frontend && npm run dev

down:
	docker compose down
