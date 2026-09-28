# Deployment Guide — MineAI Sentinel

This guide explains how to deploy MineAI Sentinel across cloud environments.

---

## Option 1: Docker Compose Deployment (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/your-team/mineai-sentinel.git
cd mineai-sentinel
```

2. Launch backend and frontend containers:
```bash
docker-compose up --build -d
```

3. Access application:
- Frontend Dashboard: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`

---

## Option 2: Cloud Platform Deployment (Vercel + Render)

### Backend Deployment (Render / Railway / Fly.io)
1. Select Docker build or Python 3.13 environment.
2. Root Directory: `mineai-sentinel/backend`
3. Build Command: `pip install -r requirements.txt && python ../backend/ml/generator.py && python ../backend/ml/train.py`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. Environment Variables: `DEMO_MODE=True`

### Frontend Deployment (Vercel / Netlify)
1. Import repository on Vercel.
2. Root Directory: `mineai-sentinel/frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variable:
   - `VITE_API_URL`: URL of deployed backend (e.g. `https://mineai-sentinel-api.onrender.com/api`)

---

## Option 3: Real MOIL Data Replacement (Database Integration)

To replace synthetic datasets with actual MOIL ERP / PostgreSQL databases:
1. Update `backend/app/core/data_provider.py` to implement `RealDataProvider`.
2. Connect `RealDataProvider` to PostgreSQL / PostGIS connection strings.
3. Switch `get_data_provider()` to return `RealDataProvider()`.
4. No frontend or ML API changes are required!
