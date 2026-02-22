# Complete Deployment Guide - Backend + Frontend

## 📋 Overview

This project uses:
- **Backend**: FastAPI on Render (Python)
- **Frontend**: Next.js on Vercel (TypeScript/React)
- **ML**: Models in backend folder

## 🎯 Deployment Sequence

### Phase 1: Backend (Render)
1. ✅ Create `render.yaml` 
2. ✅ Create `backend/requirements.txt`
3. ✅ Update config for environment variables
4. ✅ Push to GitHub
5. → Deploy on Render
6. → Get backend URL

### Phase 2: Frontend (Vercel)
1. ✅ Create `front-end/vercel.json`
2. ✅ Create `front-end/.env.example`
3. ✅ Update backend CORS with frontend URL
4. ✅ Push to GitHub
5. → Deploy on Vercel
6. → Update CORS again with Vercel URL

## 🚀 Step-by-Step Deployment

### STEP 1: Backend Deployment (Render)

#### 1a. Prepare Repository
```bash
cd dataquest-insurance-brokerage-ai-assistant

# Commit all changes
git add .
git commit -m "Add Render backend deployment configuration"
git push origin main
```

#### 1b. Create Render Web Service
1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click **New** → **Web Service**
4. Select your repository and authorize
5. Select branch: `main`
6. Settings:
   - **Name**: `insurance-broker-backend`
   - **Runtime**: Python
   - **Build command**: `pip install -r backend/requirements.txt`
   - **Start command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### 1c. Configure Environment Variables (Render)
In Render dashboard → Environment:
```
ENVIRONMENT=production
SECRET_KEY=<Render will auto-generate>
DATABASE_URL=sqlite+aiosqlite:///./broker.db
ALLOWED_ORIGINS=http://localhost:3000
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

#### 1d. Deploy
- Click **Create Web Service**
- Wait for deployment (check logs)
- Copy the URL: `https://insurance-broker-backend.onrender.com`

#### 1e. Verify Backend
```bash
# Test API is running
curl https://insurance-broker-backend.onrender.com/

# Should return: {"message": "Broker AI API is running"}
```

---

### STEP 2: Update Backend CORS

Once you have the Vercel frontend URL (from Step 3), update backend:

1. Go to Render → Backend service
2. Environment → Edit `ALLOWED_ORIGINS`
3. Add Vercel URL:
   ```
   https://insurance-broker-frontend.vercel.app
   ```
4. Save & Redeploy

---

### STEP 3: Frontend Deployment (Vercel)

#### 3a. Prepare Frontend
```bash
# No additional changes needed - already configured

# But verify locally
cd front-end
npm run build    # Should complete without errors
```

#### 3b. Create Vercel Project
1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click **Add New** → **Project**
4. Select your repository
5. Framework: **Next.js** (auto-detected)
6. Settings:
   - **Project name**: `insurance-broker-frontend`
   - **Root directory**: `front-end` ← IMPORTANT!
   - **Build command**: `npm run build` (default)
   - **Output directory**: `.next` (default)

#### 3c. Configure Environment Variables (Vercel)
In Vercel → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://insurance-broker-backend.onrender.com
```

#### 3d. Deploy
- Click **Deploy**
- Wait for build & deployment (~3 minutes)
- Get frontend URL: `https://insurance-broker-frontend.vercel.app`

#### 3e. Verify Frontend
```bash
# Visit frontend
https://insurance-broker-frontend.vercel.app

# Check DevTools → Console for errors
# Check Network tab for API calls
```

---

### STEP 4: Final CORS Update

Now that you have both URLs, update backend CORS one more time:

1. Render → Backend service
2. Environment → `ALLOWED_ORIGINS`
3. Set to:
   ```
   https://insurance-broker-frontend.vercel.app
   ```
4. Redeploy

---

## 🧪 Testing & Verification

### Local Testing
```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd front-end
npm run dev

# Visit http://localhost:3000
```

### Production Testing
1. Visit `https://insurance-broker-frontend.vercel.app`
2. Open DevTools → Network tab
3. Try to login/signup
4. Should see API calls to backend
5. No CORS errors should appear

## 📊 Deployment Checklist

### Backend (Render)
- [ ] `render.yaml` created
- [ ] `backend/requirements.txt` exists
- [ ] `backend/app/config.py` reads env vars
- [ ] `backend/app/main.py` uses CORS from settings
- [ ] Pushed to GitHub
- [ ] Render deployment successful
- [ ] Backend URL accessible
- [ ] API health check: `GET /` returns 200

### Frontend (Vercel)
- [ ] `front-end/vercel.json` created
- [ ] `front-end/.env.example` exists
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] Root directory set to `front-end`
- [ ] Pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Frontend URL accessible
- [ ] API calls work from frontend

### Integration
- [ ] Backend `ALLOWED_ORIGINS` includes frontend
- [ ] Login API call works end-to-end
- [ ] No CORS errors in browser console
- [ ] Database operations work
- [ ] ML models load properly (if used)

## 🔄 Updating Deployments

### Update Backend
```bash
cd backend
# Make changes...
git add .
git commit -m "Update backend"
git push origin main
# Render auto-redeploys
```

### Update Frontend
```bash
cd front-end
# Make changes...
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-redeploys
```

### Update Environment Variables
- **Render**: Dashboard → Service → Environment → Edit
- **Vercel**: Dashboard → Project → Settings → Environment Variables

## 📚 Architecture

```
Users (Browser)
    ↓
Vercel (Front-end)
    ↓
CORS → Render (Backend)
    ↓
    ├─ Database (SQLite)
    ├─ ML Models (joblib)
    └─ Authentication (JWT)
```

## 🐛 Troubleshooting

### "CORS error" in browser
- Check backend `ALLOWED_ORIGINS` includes frontend URL
- Ensure backend is running
- Check backend CORS middleware in `app/main.py`

### "API call times out"
- Check backend is deployed and running
- Check `NEXT_PUBLIC_API_URL` is correct
- Check network connectivity

### Build fails on Vercel
- Verify root directory is `front-end`
- Run `npm run build` locally to debug
- Check for TypeScript errors

### API 404 errors
- Verify backend routes exist
- Check backend `app/routers/` files exist
- Check routers are registered in `app/main.py`

## 📞 Connection Check Script

Save as `verify_deployment.sh`:

```bash
#!/bin/bash

echo "Testing Backend..."
curl -s https://insurance-broker-backend.onrender.com/ | jq .

echo "\nTesting Frontend..."
curl -s https://insurance-broker-frontend.vercel.app/ | head -20

echo "\nTesting API Connection..."
curl -s -H "Origin: https://insurance-broker-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://insurance-broker-backend.onrender.com/
```

## 🎬 Next Steps

1. Monitor both deployments in dashboards
2. Set up error monitoring (optional: Sentry)
3. Configure custom domains (optional)
4. Set up CI/CD alerts
5. Monitor database size and queries
6. Plan scaling if needed

---

**✅ Both backend and frontend are deployed and connected!**
