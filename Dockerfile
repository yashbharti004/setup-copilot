FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    PORT=10000

# Install Python 3, pip, venv, and native build tools for compiling Python wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Prepare Backend
COPY apm-backend/requirements.txt ./backend/
RUN python3 -m venv /app/backend/.venv && \
    /app/backend/.venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/backend/.venv/bin/pip install --no-cache-dir -r ./backend/requirements.txt
COPY apm-backend/ ./backend/

# 2. Prepare Frontend
COPY apm-ui/package.json apm-ui/package-lock.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

COPY apm-ui/ ./
RUN npm run build

WORKDIR /app

# 3. Create startup runner script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 10000

CMD ["bash", "/app/start.sh"]
