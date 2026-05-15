# Viewer Count Service

A real-time microservice that tracks live stream viewer counts using Redis and Kafka. Built with Node.js, TypeScript, and clean architecture principles.

---

## Overview

When a user joins a live stream, an event is published to Kafka. The Viewer Count Service consumes that event and updates a counter in Redis instantly. The service also handles **ghost users** — viewers who lose internet connection without sending a leave event — using Redis TTL and Keyspace Notifications.

---

## Tech Stack

| Technology              | Purpose                            |
| ----------------------- | ---------------------------------- |
| Node.js + TypeScript    | Runtime and language               |
| Express                 | HTTP server                        |
| Redis                   | Real-time counter and TTL tracking |
| Kafka + Zookeeper       | Async event consumption            |
| JWT + Keycloak          | Authentication                     |
| Pino                    | Structured logging                 |
| Jest + ts-jest          | Unit testing (97.66% coverage)     |
| Docker + Docker Compose | Local containerization             |
| Kubernetes              | Production orchestration           |
| Jenkins                 | CI/CD pipeline                     |

---

## Project Structure

```
src/
├── app/
│   ├── ports/            # Interfaces (IViewerRepository)
│   └── usecases/         # JoinStream, LeaveStream, GetViewerCount
├── domain/
│   └── viewer.ts         # ViewerEvent type
├── infra/
│   ├── cache/            # Redis client + Keyspace listener
│   ├── config/           # Environment variables
│   ├── health/           # Health check endpoint
│   ├── http/
│   │   ├── middlewares/  # JWT auth middleware
│   │   └── routes/       # REST endpoints
│   ├── logger/           # Pino structured logger
│   ├── messaging/        # Kafka consumer
│   └── persistence/      # RedisViewerRepository
├── app.ts
├── di.ts                 # Dependency injection
└── index.ts              # Bootstrap
k8s/
├── namespace.yaml
├── configmap.yaml
├── deployment.yaml
├── service.yaml
├── redis.yaml
└── kafka.yaml
tests/
└── unit/                 # 52 unit tests
```

---

## Prerequisites

- Docker Desktop with Kubernetes enabled
- Node.js 20+
- Jenkins (optional for CI/CD)

---

## Local Development with Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/getuar04/viewer-count-service.git
cd viewer-count-service
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

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

### 4. Enable Redis Keyspace Notifications

```bash
docker exec -it vcs-redis redis-cli config set notify-keyspace-events Ex
```

### 5. Verify the service

```bash
curl http://localhost:3000/health
```

Expected:

```json
{ "status": "ok", "redis": "connected" }
```

---

## Kubernetes Deployment

### 1. Build Docker image

```bash
docker build -t viewer-count-service:latest .
```

### 2. Create namespace and apply manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/kafka.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 3. Create secret (never commit to Git)

```powershell
kubectl create secret generic viewer-count-secrets `
  --namespace=viewer-count-service `
  --from-literal=JWT_SECRET="YOUR_JWT_SECRET_HERE" `
  --dry-run=client -o yaml | kubectl apply -f -
```

### 4. Verify pods

```bash
kubectl get pods -n viewer-count-service
```

Expected output:

```
NAME                                  READY   STATUS    RESTARTS
kafka-xxx                             1/1     Running   0
redis-xxx                             1/1     Running   0
viewer-count-service-xxx              1/1     Running   0
zookeeper-xxx                         1/1     Running   0
```

### 5. Test via port-forward

```bash
kubectl port-forward -n viewer-count-service deployment/viewer-count-service 3001:3000
curl http://localhost:3001/health
```

---

## CI/CD with Jenkins

### Setup Jenkins

Build the custom Jenkins image:

```bash
docker build -f Dockerfile.jenkins -t jenkins-custom .
```

Run Jenkins:

```powershell
.\jenkins-docker-run.sh
```

Jenkins will be available at `http://localhost:8080`.

Get initial admin password:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### Configure Pipeline

1. New Item → Pipeline
2. Pipeline script from SCM → Git
3. Repository URL: `https://github.com/getuar04/viewer-count-service.git`
4. Branch: `*/main`
5. Script Path: `Jenkinsfile`

### Enable Auto-trigger on Push (Webhook)

1. Install **ngrok**: https://ngrok.com
2. Expose Jenkins locally:

```bash
ngrok http 8080
```

3. Copy the ngrok URL (e.g. `https://abc123.ngrok.io`)
4. Go to GitHub repo → **Settings → Webhooks → Add webhook**
   - Payload URL: `https://abc123.ngrok.io/github-webhook/`
   - Content type: `application/json`
   - Event: **Just the push event**
5. In Jenkins → Pipeline → **Build Triggers** → check **GitHub hook trigger for GITScm polling**

Every `git push` to `main` will now automatically trigger the full pipeline.

### Pipeline Stages

| Stage                | Description                                   |
| -------------------- | --------------------------------------------- |
| Checkout             | Pulls latest code from GitHub                 |
| Setup Kubeconfig     | Configures kubectl for deployment             |
| Install Dependencies | Runs `npm install`                            |
| Run Tests            | Runs Jest with coverage report                |
| Build Docker Image   | Builds and tags Docker image                  |
| Deploy to Kubernetes | Applies K8s manifests and rolls out new image |

---

## API Endpoints

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Generate a token at **jwt.io** using your `JWT_SECRET` with payload `{ "userId": "123" }`.

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

The service consumes events from the `viewer-events` topic.

### Event Types

```json
{ "type": "ViewerJoined", "streamId": "456", "userId": "123", "timestamp": "..." }
{ "type": "ViewerLeft", "streamId": "456", "userId": "123", "timestamp": "..." }
{ "type": "ViewerHeartbeat", "streamId": "456", "userId": "123", "timestamp": "..." }
```

### Test Kafka manually (Docker Compose)

```bash
docker exec -it vcs-kafka kafka-console-producer --broker-list kafka:9092 --topic viewer-events
```

Then type and press Enter:

```json
{
  "type": "ViewerJoined",
  "streamId": "456",
  "userId": "123",
  "timestamp": "2026-05-12T12:00:00Z"
}
```

---

## Redis Data Structure

| Key                                 | Type             | Purpose                   |
| ----------------------------------- | ---------------- | ------------------------- |
| `stream:{streamId}:viewers`         | Set              | Active viewer user IDs    |
| `stream:{streamId}:viewer_count`    | String           | Current count (O(1) read) |
| `stream:{streamId}:viewer:{userId}` | String + TTL 60s | Heartbeat tracker         |

---

## Ghost User Detection

If a viewer loses internet without sending a leave event, their TTL expires after 60 seconds. Redis fires a Keyspace Notification and the service automatically removes them from the count.

Heartbeat is sent every **30 seconds**, TTL is **60 seconds** — giving 30 seconds buffer for network delays.

---

## Running Tests

```bash
npm test
```

With coverage:

```bash
npm test -- --coverage
```

Current coverage: **97.66%** across 52 tests.

---

## Stop Everything

### Docker Compose

```bash
docker-compose down
```

### Kubernetes

```bash
kubectl delete namespace viewer-count-service
```

### Jenkins

```bash
docker stop jenkins
```

### Clean Docker resources

```bash
docker system prune -f
```

### Redis CLI

```bash
docker exec -it vcs-redis redis-cli
```

```
kubectl exec -it -n viewer-count-service deployment/redis -- redis-cli
```

Then inside Redis CLI:

```redis
GET active_stream:456
GET stream:456:viewer_count
SMEMBERS stream:456:viewers
TTL stream:456:viewer:123
```

### Kafka CLI

```bash
docker exec -it vcs-kafka bash
kafka-console-consumer --bootstrap-server localhost:9092 --topic viewer-events --from-beginning
```

### logs 
```bash
docker logs -f viewer-count-service

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMiJ9.GO1hPCTR9yw7erPlPF3Jz_1symFY1xLYnXy3GtPtrGw

# Health check

curl http://localhost:3001/health

# Start stream

curl -X POST -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMiJ9.GO1hPCTR9yw7erPlPF3Jz_1symFY1xLYnXy3GtPtrGw" http://localhost:3001/streams/456/start

# Join stream

curl -X POST -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMiJ9.GO1hPCTR9yw7erPlPF3Jz_1symFY1xLYnXy3GtPtrGw" http://localhost:3001/streams/456/join

# Get viewer count

curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMiJ9.GO1hPCTR9yw7erPlPF3Jz_1symFY1xLYnXy3GtPtrGw" http://localhost:3001/streams/456/viewers
