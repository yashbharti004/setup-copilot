# Deploying Setup-Copilot on Railway

This repository is pre-configured and production-ready for deployment on [Railway](https://railway.app/).

You can deploy using either:
- **Option 1: Unified Container (Fastest & Easiest — Recommended)**: Runs both FastAPI and Next.js in a single Railway service. Ideal for free-tier / hobby deployments.
- **Option 2: Multi-Service Architecture**: Runs `apm-backend` and `apm-ui` as two separate scaling services with private networking.

---

## Option 1: Unified Container (1-Click Root Deploy)

Railway will automatically detect the root `railway.json` and `Dockerfile`. It starts the Python FastAPI backend internally on port `8001` and binds the Next.js frontend to Railway's assigned `$PORT`.

### Step-by-Step Instructions:
1. **Push your code to GitHub**.
2. Log into [Railway.app](https://railway.app/) and click **"New Project"**.
3. Select **"Deploy from GitHub repo"** and choose your repository.
4. Railway will automatically detect the root `Dockerfile` and `railway.json`.
5. Under the **Variables** tab, add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here (optional, for live search)
   GEMINI_MODEL=gemini-3.8-flash (optional, defaults to gemini-3.8-flash)
   ```
6. Click **Deploy**.
7. Under the **Settings** tab, scroll to **Networking** and click **"Generate Domain"** to get your public URL (e.g., `https://setup-copilot-production.up.railway.app`).

---

## Option 2: Multi-Service Architecture (Separate Backend & Frontend)

If you want to scale the API and the web frontend independently:

### Step 1: Deploy `apm-backend`
1. In your Railway project, click **"+ New"** $\to$ **"GitHub Repo"** $\to$ select this repository.
2. In the service settings, rename it to `apm-backend`.
3. Under **Settings** $\to$ **Source Directory**, set **Root Directory** to:
   ```
   /apm-backend
   ```
4. Under **Variables**, add:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   CORS_ORIGINS=*
   ```
5. Under **Settings** $\to$ **Networking**, click **"Generate Domain"** (e.g. `https://apm-backend.up.railway.app`).

### Step 2: Deploy `apm-ui`
1. In the same project, click **"+ New"** $\to$ **"GitHub Repo"** $\to$ select the same repository.
2. Rename this service to `apm-ui`.
3. Under **Settings** $\to$ **Source Directory**, set **Root Directory** to:
   ```
   /apm-ui
   ```
4. Under **Variables**, configure the connection to your backend:
   ```env
   BACKEND_URL=https://apm-backend.up.railway.app
   NEXT_PUBLIC_BACKEND_URL=https://apm-backend.up.railway.app
   ```
   *(Or use Railway Private Networking: `http://${{apm-backend.RAILWAY_PRIVATE_DOMAIN}}:8001`)*
5. Under **Settings** $\to$ **Networking**, click **"Generate Domain"** to expose your frontend web app.

---

## Environment Variables Reference

| Variable | Service | Required | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Backend | **Yes** (for live audits) | Google Gemini API Key for autonomous fact extraction |
| `TAVILY_API_KEY` | Backend | Optional | Search API for live unfamiliar provider discovery |
| `GEMINI_MODEL` | Backend | Optional | Model identifier (defaults to `gemini-3.8-flash`) |
| `CORS_ORIGINS` | Backend | Optional | Allowed origins (defaults to `*` or frontend domain) |
| `BACKEND_URL` | Frontend | **Yes** (in Option 2) | URL of the running FastAPI backend |
| `PORT` | Both | Automatic | Injected automatically by Railway |

---

## Health Checks & Zero-Downtime Deploys

Both services provide built-in health check endpoints configured in their `railway.json`:
- **Backend Health**: `GET /api/health` $\to$ `{"ok": true, "model": "gemini-3.8-flash", "keys_configured": true}`
- **Frontend Health**: `GET /api/health` $\to$ `{"status": "ok", "backend_connected": true}`

Railway uses these health checks to ensure traffic is only routed to healthy containers.

---

## Local Testing with Docker Compose

Before deploying, you can test the production containers locally:

```bash
# Set your API key in environment
export GEMINI_API_KEY="your_api_key"

# Build and run with Docker Compose
docker compose up --build
```
- Frontend available at: `http://localhost:3000`
- Backend API available at: `http://localhost:8001`
