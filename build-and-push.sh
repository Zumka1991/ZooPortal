#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Конфигурация
DOCKER_USERNAME="traxex864"
BACKEND_IMAGE="$DOCKER_USERNAME/domzverei-backend:latest"
FRONTEND_IMAGE="$DOCKER_USERNAME/domzverei-frontend:latest"
API_URL="https://domzverei.ru/api"

echo -e "${BLUE}=== DomZverei Docker Build & Push ===${NC}\n"

# Проверка что мы в корне проекта
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}Ошибка: Запустите скрипт из корня проекта${NC}"
    exit 1
fi

# Проверка авторизации в Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Ошибка: Docker не запущен${NC}"
    exit 1
fi

echo -e "${GREEN}Проверяю авторизацию в Docker Hub...${NC}"
if ! docker login --username $DOCKER_USERNAME 2>&1 | grep -q "Login Succeeded"; then
    echo -e "${RED}Требуется авторизация в Docker Hub${NC}"
    docker login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Ошибка авторизации${NC}"
        exit 1
    fi
fi

echo -e "\n${GREEN}Собираю Backend...${NC}"
docker build -t $BACKEND_IMAGE ./backend
if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка сборки Backend${NC}"
    exit 1
fi

echo -e "\n${GREEN}Собираю Frontend...${NC}"
docker build -t $FRONTEND_IMAGE \
    --build-arg NEXT_PUBLIC_API_URL=$API_URL \
    ./frontend
if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка сборки Frontend${NC}"
    exit 1
fi

echo -e "\n${GREEN}Пушу Backend в Docker Hub...${NC}"
docker push $BACKEND_IMAGE
if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка пуша Backend${NC}"
    exit 1
fi

echo -e "\n${GREEN}Пушу Frontend в Docker Hub...${NC}"
docker push $FRONTEND_IMAGE
if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка пуша Frontend${NC}"
    exit 1
fi

echo -e "\n${GREEN}✓ Образы успешно собраны и загружены!${NC}\n"
echo -e "${BLUE}Для деплоя на сервере выполните:${NC}"
echo -e "  ${GREEN}sudo docker-compose pull${NC}"
echo -e "  ${GREEN}sudo docker-compose up -d${NC}"
echo -e "\n${BLUE}Для просмотра логов:${NC}"
echo -e "  ${GREEN}sudo docker-compose logs -f${NC}\n"
