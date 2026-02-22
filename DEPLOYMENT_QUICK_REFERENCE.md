# 🚀 Deployment Quick Reference Card

## Backend Deployments URLs
- Render: https://render.com/dashboard/services
- Status: ⏳ Ready to deploy (run render.yaml)

## Frontend Deployment URLs
- Vercel: https://vercel.com/dashboard
- Status: ⏳ Ready to deploy

## Git Commands

```bash
# Commit all deployment changes
git add .
git commit -m "Add Render & Vercel deployment configs"
git push origin main
```

## Backend (Render) - Copy/Paste Setup

### Step 1: Create Web Service
- URL: https://render.com
- Click: New → Web Service
- GitHub: Select your repo
- Build command: `pip install -r backend/requirements.txt`
- Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 2: Environment Variables
```
ENVIRONMENT=production
SECRET_KEY=[AUTO-GENERATE]
DATABASE_URL=sqlite+aiosqlite:///./broker.db
ALLOWED_ORIGINS=http://localhost:3000
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Step 3: After Deploy
- Copy backend URL
- Update ALLOWED_ORIGINS with Vercel frontend URL

## Frontend (Vercel) - Copy/Paste Setup

### Step 1: Create Project
- URL: https://vercel.com
- Click: Add New → Project
- GitHub: Select your repo
- **Root Directory: `front-end`** ⭐ IMPORTANT

### Step 2: Environment Variables
```
NEXT_PUBLIC_API_URL=[YOUR RENDER BACKEND URL]
```

### Step 3: Deploy
- Click Deploy
- Wait for build
- Copy frontend URL

## Test Commands

```bash
# Backend Health Check
curl https://your-backend.onrender.com/

# Expected Response
{"message": "Broker AI API is running"}

# Frontend Accessibility
curl https://your-frontend.vercel.app/ | head -20
```

## Environment Variables Summary

| Service | Variable | Value |
|---------|----------|-------|
| Backend | ENVIRONMENT | production |
| Backend | SECRET_KEY | [Auto-generate] |
| Backend | DATABASE_URL | sqlite+aiosqlite:///./broker.db |
| Backend | ALLOWED_ORIGINS | https://your-frontend.vercel.app |
| Frontend | NEXT_PUBLIC_API_URL | https://your-backend.onrender.com |

## Files Created

- ✅ `render.yaml` - Backend config
- ✅ `backend/requirements.txt` - Dependencies
- ✅ `backend/.env.example` - Backend template
- ✅ `backend/app/config.py` - Updated
- ✅ `backend/app/main.py` - Updated
- ✅ `front-end/vercel.json` - Frontend config
- ✅ `front-end/.env.example` - Frontend template
- ✅ `front-end/.gitignore` - Updated
- ✅ Documentation files

## Important Notes

1. **Root Directory**: Frontend root directory MUST be set to `front-end` in Vercel
2. **CORS**: Update backend CORS after getting frontend URL
3. **Environment Vars**: Must have `NEXT_PUBLIC_` prefix in frontend
4. **Build Order**: Deploy backend first, then frontend
5. **Verification**: Test API calls in browser DevTools after deployment

## Deployment Checklist

- [ ] Push to GitHub: `git push origin main`
- [ ] Backend deployed on Render
- [ ] Backend URL verified accessible
- [ ] Frontend deployed on Vercel
- [ ] Frontend `NEXT_PUBLIC_API_URL` set correctly
- [ ] Backend CORS updated with frontend URL
- [ ] Both services tested and working
- [ ] No CORS errors in console
- [ ] API calls successful

## Monitoring Links

- Render Backend Logs: https://dashboard.render.com/services
- Vercel Frontend Logs: https://vercel.com/dashboard

## Troubleshooting Quick Links

- Backend errors: Check Render service logs
- Frontend errors: Check Vercel deployment logs
- CORS errors: Update backend ALLOWED_ORIGINS
- Build fails: Run `npm run build` locally first

---

**Last Updated**: 2026-02-22
**Status**: ✅ Ready for Production Deployment
