# Viewer Count Service — Komandat

---

## 1. Docker Compose — Starto lokalisht

```powershell
# Starto të gjitha services
docker-compose up -d --build

# Kontrollo containers
docker ps

# Shiko logs live
docker logs -f vcs-app

# Ndalo
docker-compose down
```

---

## 2. Docker — Build Image

```powershell
# Build image
docker build -t viewer-count-service:latest .

# Build me tag specifik
docker build -t viewer-count-service:build-26 -t viewer-count-service:latest .
```

---

## 3. Kubernetes — Deploy

```powershell
# Apliko të gjitha manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/kafka.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Krijo secret
kubectl create secret generic viewer-count-secrets `
  --namespace=viewer-count-service `
  --from-literal=JWT_SECRET="657928478954RUHD879YHN38R7Y9UJD3HY6R87HIDY3H879UEJH7389RYUN487EY9RHID3879HD387WIHSDNBYU3R87EY3879HD2UY3R7hdubuy3d7dh398ndyx3edhuy87diu" `
  --dry-run=client -o yaml | kubectl apply -f -

# Kontrollo pods
kubectl get pods -n viewer-count-service
```

---

## 4. Kubernetes — Rollout

```powershell
# Restart deployment
kubectl rollout restart deployment/viewer-count-service -n viewer-count-service

# Kontrollo status
kubectl rollout status deployment/viewer-count-service -n viewer-count-service --timeout=600s

# Update image
kubectl set image deployment/viewer-count-service `
  viewer-count-service=viewer-count-service:build-26 `
  -n viewer-count-service
```

---

## 5. Kubernetes — Port Forward dhe Testing

```powershell
# Port forward
kubectl port-forward -n viewer-count-service deployment/viewer-count-service 3001:3000

# Logs
kubectl logs -f -n viewer-count-service deployment/viewer-count-service
```

---

## 6. Redis — Docker Compose

```powershell
# Hyr brenda
docker exec -it vcs-redis redis-cli

# Shiko të gjitha keys
docker exec -it vcs-redis redis-cli KEYS "*"

# Stream aktiv
docker exec -it vcs-redis redis-cli GET active_stream:789

# Viewer count
docker exec -it vcs-redis redis-cli GET stream:789:viewer_count

# Lista viewers
docker exec -it vcs-redis redis-cli SMEMBERS stream:789:viewers

# TTL heartbeat
docker exec -it vcs-redis redis-cli TTL stream:789:viewer:12
```

---

## 7. Redis — Kubernetes

```powershell
# Shiko të gjitha keys
kubectl exec -it -n viewer-count-service deployment/redis -- redis-cli KEYS "*"

# Stream aktiv
kubectl exec -it -n viewer-count-service deployment/redis -- redis-cli GET active_stream:789

# Viewer count
kubectl exec -it -n viewer-count-service deployment/redis -- redis-cli GET stream:789:viewer_count

# Lista viewers
kubectl exec -it -n viewer-count-service deployment/redis -- redis-cli SMEMBERS stream:789:viewers

# TTL heartbeat
kubectl exec -it -n viewer-count-service deployment/redis -- redis-cli TTL stream:789:viewer:12
```

---

## 8. Kafka — Publiko Evente (Docker)

```powershell
# Hyr brenda Kafka
docker exec -it vcs-kafka bash

# Hap producer
kafka-console-producer --bootstrap-server localhost:9092 --topic viewer-events
```

**Evente për të dërguar:**

```json
{"type":"StreamStarted","streamId":"789","creatorId":"456","timestamp":"2026-05-15T10:00:00Z"}
{"type":"ViewerJoined","streamId":"789","userId":"123","timestamp":"2026-05-15T10:00:10Z"}
{"type":"ViewerHeartbeat","streamId":"789","userId":"123","timestamp":"2026-05-15T10:00:40Z"}
{"type":"ViewerLeft","streamId":"789","userId":"123","timestamp":"2026-05-15T10:01:00Z"}
{"type":"StreamEnded","streamId":"789","timestamp":"2026-05-15T10:05:00Z"}
```

---

## 9. Teste

```powershell
# Ekzekuto testet
npm test

# Ekzekuto me coverage
npm test -- --coverage
```

---

## 10. Curl — Testo API

```powershell
# Health check
curl http://localhost:3000/health

# Trigger event (dev endpoint)
curl -X POST `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMiJ9.GO1hPCTR9yw7erPlPF3Jz_1symFY1xLYnXy3GtPtrGw" `
  -H "Content-Type: application/json" `
  -d '{"type":"StreamStarted","streamId":"789","creatorId":"456"}' `
  http://localhost:3000/dev/events/trigger

# Get viewer count
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMiJ9.GO1hPCTR9yw7erPlPF3Jz_1symFY1xLYnXy3GtPtrGw" `
  http://localhost:3000/streams/789/viewers
```

---

## 11. Swagger UI

```
http://localhost:3000/api-docs   # Docker Compose
http://localhost:3001/api-docs   # Kubernetes
```

**Token:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMiJ9.GO1hPCTR9yw7erPlPF3Jz_1symFY1xLYnXy3GtPtrGw
```

---

## 12. Flow i plotë për testing

```powershell
# 1. Starto Docker Compose
docker-compose up -d --build

# 2. Trego Swagger ose Postman - StreamStarted
curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" `
  -d '{"type":"StreamStarted","streamId":"789","creatorId":"456"}' `
  http://localhost:3000/dev/events/trigger

# 3. ViewerJoined
curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" `
  -d '{"type":"ViewerJoined","streamId":"789","userId":"123"}' `
  http://localhost:3000/dev/events/trigger

# 4. Kontrollo Redis
docker exec -it vcs-redis redis-cli GET stream:789:viewer_count
docker exec -it vcs-redis redis-cli SMEMBERS stream:789:viewers

# 5. Get viewers
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/streams/789/viewers

# 6. StreamEnded
curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" `
  -d '{"type":"StreamEnded","streamId":"789"}' `
  http://localhost:3000/dev/events/trigger

# 7. Verifiko Redis i pastruar
docker exec -it vcs-redis redis-cli KEYS "*"
```
