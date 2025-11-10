# NestJS Microservices Example

Демонстрационный проект на NestJS, реализующий взаимодействие между двумя микросервисами через Kafka и gRPC.

## Архитектура

Проект состоит из двух микросервисов:

- **service-api**: Принимает gRPC/HTTP запросы, публикует события в Kafka
- **service-worker**: Потребляет сообщения из Kafka, обрабатывает и сохраняет их

### Схема взаимодействия

```
[gRPC/HTTP Client] → [service-api] → Outbox → Kafka (message_created) → [service-worker]
                         ↓              ↓                                      ↓
                    [Redis]      [PostgreSQL API DB]              [PostgreSQL Worker DB]
                 (idempotency)      (outbox)                          (messages)

[GetMessages] → [service-api] → gRPC → [service-worker] → [PostgreSQL Worker DB]
```

## Требования

- Node.js LTS (v20+)
- Docker и Docker Compose
- npm или yarn
- Protocol Buffers Compiler (protoc) - для генерации TypeScript типов из proto файлов

### Установка protoc

```bash
brew install protobuf
```

## Установка

```bash
npm install
```

## Запуск

```bash
docker-compose up -d
```

Проверить, что все сервисы запущены:

```bash
docker-compose ps
```

**Инфраструктура:**
- `postgres-api` (порт 5432) - БД для service-api (Outbox pattern)
- `postgres-worker` (порт 5433) - БД для service-worker (сообщения)
- `redis` (порт 6379) - Кэш для идемпотентности
- `zookeeper` (порт 2181) - Координатор для Kafka
- `kafka` (порт 9092) - Message broker

### 2. Запустите service-api

В одном терминале:

```bash
npm run start:api
```

Сервис будет доступен:
- HTTP: http://localhost:3000
- gRPC: localhost:5001
- БД: PostgreSQL на порту 5432 (api_db) - для Outbox
- Redis: localhost:6379 - для идемпотентности

### 3. Запустите service-worker

```bash
npm run start:worker
```

Сервис будет доступен:
- HTTP: http://localhost:3001
- gRPC: localhost:5002
- БД: PostgreSQL на порту 5433 (worker_db)

## Использование

### Отправка сообщения через HTTP (REST)

```bash
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{"text": "Hello, Kafka!"}'
```

### Отправка сообщения через gRPC

```bash
grpcurl -plaintext -d '{"text": "Hello from gRPC!", "idempotency_key": "grpc-key-123"}' \
  localhost:5001 messages.MessageService/CreateMessage
```

### Получение всех сообщений

**Через HTTP (service-api):**
```bash
curl http://localhost:3000/messages
```

**Через HTTP (service-worker):**
```bash
curl http://localhost:3001/messages
```

**Через gRPC (service-api):**
```bash
grpcurl -plaintext localhost:5001 messages.MessageService/GetMessages
```

**Через gRPC (service-worker напрямую):**
```bash
grpcurl -plaintext localhost:5002 messages.MessageService/GetMessages
```
