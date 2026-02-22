# Frontend Deployment on Vercel - Setup Guide

## ✅ Completed Deployment Setup

### Files Created/Updated:
1. ✅ `front-end/vercel.json` - Vercel deployment configuration
2. ✅ `front-end/.env.example` - Environment variables template
3. ✅ `front-end/next.config.mjs` - Already configured for Vercel
4. ✅ `front-end/package.json` - Already has build scripts

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
cd dataquest-insurance-brokerage-ai-assistant
git add .
git commit -m "Add Vercel frontend deployment configuration"
git push origin main
```

### Step 2: Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Framework preset: **Next.js** (auto-detected)
5. Configure project settings:
   - **Project name**: `insurance-broker-frontend`
   - **Root directory**: `front-end` (IMPORTANT!)

### Step 3: Set Environment Variables
In Vercel Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_API_URL=https://insurance-broker-backend.onrender.com
```

**Important**: Use the actual backend URL from your Render deployment!

### Step 4: Deploy
- Click **Deploy**
- Wait for build and deployment to complete (~2-3 minutes)
- Vercel provides a preview URL automatically

## 🔗 Update Backend CORS

Once you have your Vercel frontend URL, update backend on Render:

1. Go to Render dashboard → Your backend service
2. Environment → Edit `ALLOWED_ORIGINS`
3. Add your Vercel URL:
   ```
   https://your-project-name.vercel.app
   ```
4. Redeploy backend

## ✅ Verify Deployment

### Test Points:
1. **Check health**: `https://your-project.vercel.app/`
2. **Check API connectivity**: Open DevTools → Network tab
3. **Test login**: Try to log in - should connect to backend

## 📋 Configuration Details

### vercel.json
- `buildCommand`: `npm run build` - Uses Next.js build
- `outputDirectory`: `.next` - Next.js build output folder
- `env`: Declares `NEXT_PUBLIC_API_URL` as required
- `headers`: CDN caching for API routes (optional)

### Environment Variables
- `NEXT_PUBLIC_API_URL` - **REQUIRED** - Backend API endpoint
  - Local: `http://localhost:8000`
  - Production: `https://your-backend.onrender.com`

## 🔧 Build & Test Locally

### Build for production:
```bash
cd front-end
npm run build
```

### Start production server:
```bash
npm start
```

### Test with backend:
1. Make sure backend is running: `uvicorn app.main:app --reload`
2. Frontend should connect to `http://localhost:8000`

## ⚠️ Common Issues & Solutions

### Issue: API calls fail with CORS error
**Solution**: 
- Check `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Ensure backend's `ALLOWED_ORIGINS` includes your Vercel URL
- Check backend CORS middleware in `backend/app/main.py`

### Issue: Build fails
**Solution**:
- Check `front-end/` is specified as root directory in Vercel
- Verify `package.json` has build script defined
- Check for TypeScript errors: `npm run build` locally

### Issue: 404 errors on routes
**Solution**:
- Vercel may need output rewrites for Next.js
- `vercel.json` already includes rewrites
- Make sure all page files exist in `front-end/app/`

## 🚀 Production Checklist

- [ ] Backend deployed on Render
- [ ] Backend `ALLOWED_ORIGINS` includes Vercel URL
- [ ] Frontend `NEXT_PUBLIC_API_URL` points to backend
- [ ] API calls work in browser DevTools
- [ ] Login/Auth flows work end-to-end
- [ ] Database queries execute properly
- [ ] Environment variables are set in Vercel dashboard
- [ ] No hardcoded URLs in frontend code

## 📝 Next Steps

1. Monitor Vercel deployment logs
2. Test all authentication flows
3. Test all API endpoints
4. Set up error monitoring (Sentry optional)
5. Configure custom domain if needed

## 🔗 Useful Links

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel CLI: https://vercel.com/cli
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

---
**Status**: ✅ Frontend is ready for deployment on Vercel
