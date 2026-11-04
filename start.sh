#!/bin/bash
set -e

echo "[STARTUP] Starting APM FastAPI backend on port 8001..."
cd /app/backend
/app/backend/.venv/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8001 &
BACKEND_PID=$!

# Wait for backend health check
echo "[STARTUP] Waiting for backend to become healthy..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8001/api/health > /dev/null; then
    echo "[STARTUP] APM Backend is healthy on port 8001!"
    break
  fi
  sleep 1
done

echo "[STARTUP] Starting Next.js frontend on port ${PORT:-3000}..."
cd /app/frontend
export BACKEND_URL="http://127.0.0.1:8001"
exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
