# Viewer Count Service

A real-time microservice that tracks how many users are watching a live stream at any given moment. Built with Node.js, TypeScript, Redis, and Kafka.

---

## Overview

When a user joins a live stream, an event is published to Kafka. The Viewer Count Service consumes that event and updates a counter in Redis. The count is always available instantly via a REST endpoint.

The service also handles **ghost users** — viewers who lose internet connection without sending a leave event. Using Redis TTL and Keyspace Notifications, the service automatically removes inactive viewers after 60 seconds.

---

## Architecture

```
User App
   │
   ▼
Viewer Count Service (VCS)
   │              │
   ▼              ▼
Kafka           Redis
(events)       (counters + TTL)
```

### Folder Structure

```
src/
├── app/
│   ├── ports/          # Interfaces (IViewerRepository)
│   └── usecases/       # JoinStream, LeaveStream, GetViewerCount
├── domain/
│   └── viewer.ts       # ViewerEvent type
├── infra/
│   ├── cache/          # Redis client + Keyspace listener
│   ├── config/         # Environment variables
│   ├── health/         # Health check endpoint
│   ├── http/
│   │   ├── middlewares/ # JWT auth middleware
│   │   └── routes/     # REST endpoints
│   ├── logger/         # Pino structured logger
│   ├── messaging/      # Kafka consumer
│   └── persistence/    # RedisViewerRepository
├── app.ts
├── di.ts               # Dependency injection
└── index.ts            # Bootstrap
```

---

## Tech Stack

| Technology              | Purpose                            |
| ----------------------- | ---------------------------------- |
| Node.js + TypeScript    | Runtime and language               |
| Express                 | HTTP server                        |
| Redis                   | Real-time counter and TTL tracking |
| Kafka                   | Async event consumption            |
| Pino                    | Structured logging                 |
| JWT                     | Authentication                     |
| Docker + Docker Compose | Containerization                   |

---

## Prerequisites

- Docker Desktop installed and running
- Node.js 20+ (for local development)

---

## Setup & Running

### 1. Clone the repository

```bash
git clone <repository-url>
cd viewer-count-service
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
PORT=3000

REDIS_HOST=redis
REDIS_PORT=6379

KAFKA_BROKER=kafka:9092
KAFKA_GROUP_ID=viewer-count-group
KAFKA_TOPIC=viewer-events

JWT_SECRET=your_secret_here
```

### 3. Start with Docker Compose

```bash
docker-compose up -d --build
```

This starts:

- **vcs-redis** — Redis on port 6379
- **vcs-zookeeper** — Zookeeper (required by Kafka)
- **vcs-kafka** — Kafka on port 9092
- **vcs-app** — The service on port 3000

### 4. Enable Redis Keyspace Notifications (Ghost User detection)

```bash
docker exec -it vcs-redis redis-cli config set notify-keyspace-events Ex
```

### 5. Verify the service is running

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok", "redis": "connected" }
```

---

## API Endpoints

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Join Stream

```http
POST /streams/{streamId}/join
Content-Type: application/json

{ "userId": "123" }
```

Response:

```json
{ "streamId": "456", "viewerCount": 1 }
```

### Leave Stream

```http
POST /streams/{streamId}/leave
Content-Type: application/json

{ "userId": "123" }
```

Response:

```json
{ "streamId": "456", "viewerCount": 0 }
```

### Get Viewer Count

```http
GET /streams/{streamId}/viewers
```

Response:

```json
{ "streamId": "456", "viewerCount": 3847 }
```

### Health Check

```http
GET /health
```

Response:

```json
{ "status": "ok", "redis": "connected" }
```

---

## Kafka Events

The service consumes the following events from the `viewer-events` topic:

### ViewerJoined

```json
{
  "type": "ViewerJoined",
  "streamId": "456",
  "userId": "123",
  "timestamp": "2026-05-11T12:00:00Z"
}
```

### ViewerLeft

```json
{
  "type": "ViewerLeft",
  "streamId": "456",
  "userId": "123",
  "timestamp": "2026-05-11T12:00:00Z"
}
```

### ViewerHeartbeat

```json
{
  "type": "ViewerHeartbeat",
  "streamId": "456",
  "userId": "123",
  "timestamp": "2026-05-11T12:00:00Z"
}
```

### Publishing a test event manually

```bash
docker exec -it vcs-kafka kafka-console-producer \
  --broker-list kafka:9092 \
  --topic viewer-events
```

Then type and press Enter:

```json
{
  "type": "ViewerJoined",
  "streamId": "456",
  "userId": "123",
  "timestamp": "2026-05-11T12:00:00Z"
}
```

---

## Redis Data Structure

| Key                                 | Type         | Purpose                              |
| ----------------------------------- | ------------ | ------------------------------------ |
| `stream:{streamId}:viewers`         | Set          | Stores all active viewer user IDs    |
| `stream:{streamId}:viewer_count`    | String       | Current viewer count (O(1) read)     |
| `stream:{streamId}:viewer:{userId}` | String + TTL | Heartbeat tracker, expires after 60s |

---

## Ghost User Detection

If a viewer loses internet connection without sending a leave event, their heartbeat TTL expires after 60 seconds. Redis fires a Keyspace Notification which the service listens to and automatically removes the viewer from the count.

This ensures the viewer count is always accurate without any manual cleanup.

---

## Running Tests

```bash
npm test
```

With coverage:

```bash
npm test -- --coverage
```

---

## Stopping the Service

```bash
docker-compose down
```
