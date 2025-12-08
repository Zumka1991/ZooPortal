# Инструкции по обновлению на сервере

## Проблема
Ошибка `System.IO.EndOfStreamException: Attempted to read past the end of the stream` возникает из-за:
- Разрывов соединения с PostgreSQL
- Отсутствия retry policy для временных ошибок
- Неоптимальных настроек connection pooling

## Решение

### 1. Обновить код на сервере

```bash
# На сервере
cd /path/to/your/project
git pull origin main
```

### 2. Обновить Docker Compose или переменные окружения

Обновите `docker-compose.yml` или переменные окружения для контейнера backend:

```yaml
services:
  backend:
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=zooportal;Username=postgres;Password=YOUR_PASSWORD;Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;Connection Idle Lifetime=300;Connection Pruning Interval=10;Timeout=30;Command Timeout=30;Keepalive=30
```

**Важные параметры:**
- `Pooling=true` - включает connection pooling
- `Minimum Pool Size=5` - минимум 5 соединений всегда открыто
- `Maximum Pool Size=100` - максимум 100 соединений
- `Connection Idle Lifetime=300` - закрывает неактивные соединения через 5 минут
- `Timeout=30` - таймаут подключения 30 секунд
- `Command Timeout=30` - таймаут выполнения команды 30 секунд
- `Keepalive=30` - отправляет keepalive пакеты каждые 30 секунд

### 3. Пересобрать и перезапустить контейнеры

```bash
# Остановить контейнеры
docker-compose down

# Пересобрать backend (если нужно)
docker-compose build backend

# Запустить снова
docker-compose up -d

# Проверить логи
docker logs -f domzverei-backend
```

### 4. Проверить работу

После обновления проверьте:
- Нет ли ошибок в логах: `docker logs --tail 100 domzverei-backend`
- Работают ли API endpoints: `https://domzverei.ru/api/shelters`
- Нет ли 500 ошибок при загрузке страниц

## Что было изменено

### Backend (Program.cs)
- ✅ Добавлен `EnableRetryOnFailure` с 3 попытками и задержкой до 5 секунд
- ✅ Установлен Command Timeout в 30 секунд
- ✅ Включено логирование sensitive data для dev окружения

### Connection String
- ✅ Добавлены параметры connection pooling
- ✅ Настроен keepalive для поддержания соединений
- ✅ Установлены таймауты

### Frontend (error.tsx)
- ✅ Созданы страницы error.tsx для корректной обработки ошибок
- ✅ Различаются 404 (не найдено) и 500 (ошибка сервера)
- ✅ Пользователь видит дружелюбное сообщение с кнопкой "Попробовать снова"

## Мониторинг

После обновления следите за логами:

```bash
# Смотреть логи в реальном времени
docker logs -f domzverei-backend

# Фильтровать только ошибки
docker logs --tail 500 domzverei-backend | grep -i error

# Проверить статус контейнеров
docker ps
```

## Откат (если что-то пошло не так)

```bash
# Вернуться к предыдущему коммиту
git checkout HEAD~1

# Пересобрать
docker-compose build backend
docker-compose up -d
```
