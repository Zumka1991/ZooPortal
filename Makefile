.PHONY: build up down dev logs clean

# Production build
build:
	docker-compose build

# Start production containers
up:
	docker-compose up -d

# Stop containers
down:
	docker-compose down

# Development mode with hot reload
dev:
	docker-compose -f docker-compose.dev.yml up

# View logs
logs:
	docker-compose logs -f

# Clean up containers and images
clean:
	docker-compose down -v --rmi local
