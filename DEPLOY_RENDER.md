# Free Deployment on Render (Step-by-Step)

This repository is pre-configured with a Render Blueprint (`render.yaml`) and Dockerfile to deploy both the Next.js frontend and FastAPI backend **100% free with zero configuration**.

---

## Step 1: Create a GitHub Repository and Push

If you haven't pushed the repo to GitHub yet:

1. Open [github.com/new](https://github.com/new) and create a repository (e.g. `setup-copilot`).
2. Run these commands in your terminal:
   ```bash
   git remote add origin https://github.com/<your-username>/setup-copilot.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: 1-Click Deploy on Render

1. Log into [dashboard.render.com](https://dashboard.render.com/) (Free account — sign in with GitHub).
2. In the top right, click **New +** $\to$ **Blueprint**.
3. Select your `setup-copilot` GitHub repository.
4. Render will detect `render.yaml` automatically and display:
   - **Service**: `setup-copilot`
   - **Runtime**: `Docker`
   - **Plan**: `Free`
5. Under **Environment Variables**, paste your:
   - `GROQ_API_KEY`: *Your Groq API Key*
   - `GEMINI_API_KEY`: *(Optional or required if using Gemini extraction)*
   - `GROQ_MODEL`: `openai/gpt-oss-20b` or `llama-3.3-70b-versatile` (defaults to `openai/gpt-oss-20b`)
   - `TAVILY_API_KEY`: *(Optional) Search key for live unfamiliar provider discovery*
6. Click **Apply**.

Render will automatically build the unified Docker container and deploy it with a free `https://setup-copilot-xxxx.onrender.com` URL with free SSL and zero credit card needed.

---

## Alternative: Manual Web Service Setup on Render

If you prefer creating a Web Service directly without Blueprints:

1. Click **New +** $\to$ **Web Service**.
2. Select your repository.
3. Choose **Docker** as the Environment.
4. Set:
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: **Free**
   - **Health Check Path**: `/api/health`
5. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `GROQ_API_KEY`: `your_groq_api_key_here`
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
6. Click **Create Web Service**.

