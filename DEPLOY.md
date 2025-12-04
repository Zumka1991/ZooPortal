# Инструкция по деплою DomZverei

## Локальная сборка и пуш в Docker Hub

### Быстрый деплой

```bash
./build-and-push.sh
```

Скрипт автоматически:
- Проверит авторизацию в Docker Hub
- Соберёт backend и frontend образы
- Запушит образы в Docker Hub
- Покажет команды для деплоя на сервере

### Ручная сборка

```bash
# Авторизация
docker login

# Backend
docker build -t traxex864/domzverei-backend:latest ./backend
docker push traxex864/domzverei-backend:latest

# Frontend
docker build -t traxex864/domzverei-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://domzverei.ru/api \
  ./frontend
docker push traxex864/domzverei-frontend:latest
```

## Деплой на сервере

### Первоначальная настройка

1. Скопируйте `docker-compose.yml` на сервер
2. Настройте переменные окружения в `docker-compose.yml`:

```yaml
backend:
  environment:
    - App__BaseUrl=https://domzverei.ru
    - App__AdminSecret=ваш_секретный_пароль
    - ConnectionStrings__DefaultConnection=...

frontend:
  environment:
    - NEXT_PUBLIC_API_URL=https://domzverei.ru/api
    - INTERNAL_API_URL=http://backend:5000/api
```

3. Настройте nginx (см. конфиг в `/etc/nginx/sites-available/domzverei.ru`)
4. Получите SSL сертификат: `sudo certbot --nginx -d domzverei.ru`

### Обновление

```bash
# Скачать новые образы
sudo docker-compose pull

# Перезапустить контейнеры
sudo docker-compose up -d

# Посмотреть логи
sudo docker-compose logs -f
```

### Остановка

```bash
sudo docker-compose down
```

### Полная очистка (включая volumes)

```bash
sudo docker-compose down -v
```

## Полезные команды

```bash
# Посмотреть статус контейнеров
sudo docker-compose ps

# Логи конкретного сервиса
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend

# Зайти в контейнер
sudo docker-compose exec backend bash
sudo docker-compose exec frontend sh

# Посмотреть использование ресурсов
sudo docker stats

# Очистить неиспользуемые образы
sudo docker system prune -a
```
