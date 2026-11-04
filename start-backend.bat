@echo off
echo Starting APM Backend on port 8001...
cd /d "d:\ai-agent\apm-backend"
call .venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --port 8001
