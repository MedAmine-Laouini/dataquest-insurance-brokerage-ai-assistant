# Backend Deployment on Render - Setup Guide

## ✅ Completed Deployment Setup

### Files Created/Updated:
1. ✅ `backend/requirements.txt` - Dependencies extracted from pyproject.toml
2. ✅ `render.yaml` - Render deployment configuration
3. ✅ `backend/.gitignore` - Exclude sensitive files from Git
4. ✅ `backend/.env.example` - Environment variables template
5. ✅ `backend/app/config.py` - Updated to read from environment variables
6. ✅ `backend/app/main.py` - Updated CORS to support dynamic origins
7. ✅ `backend/main.py` - Updated to use FastAPI app

## 🚀 Deployment Steps

### Step 1: Add Environment Variables (Render Dashboard)
1. Go to Render: https://render.com
2. Create new Web Service > Connect GitHub
3. Select your repository
4. Environment variables to add:
   - `ENVIRONMENT`: `production`
   - `SECRET_KEY`: Generate strong random key (Render can auto-generate)
   - `DATABASE_URL`: `sqlite+aiosqlite:///./broker.db` (or PostgreSQL for production)
   - `ALLOWED_ORIGINS`: Your frontend URL (e.g., `https://yourfrontend.vercel.app`)
   - `ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`

### Step 2: Push to GitHub
```bash
cd dataquest-insurance-brokerage-ai-assistant
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 3: Deploy on Render
1. Create Web Service on Render
2. Connect to your GitHub repo
3. Set build command: `pip install -r backend/requirements.txt`
4. Set start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (see Step 1)
6. Click "Deploy"

### Step 4: Verify Deployment
- Check Render logs for build/runtime errors
- Test API: `https://your-service-name.onrender.com/`
- Should return: `{"message": "Broker AI API is running"}`

## 📋 Health Checks

Run these locally to verify setup:

### Check 1: Test imports
```bash
cd backend
python -c "from app.main import app; print('✓ App imports successfully')"
```

### Check 2: Test dependencies
```bash
cd backend
python -m pip install -r requirements.txt
```

### Check 3: Run server locally
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Then visit: `http://localhost:8000/docs` for API docs

## ⚠️ Production Considerations

### Database
- **Current**: SQLite (file-based, not suitable for production)
- **Recommended**: PostgreSQL
  - Update `DATABASE_URL`: `postgresql+asyncpg://user:password@host:port/dbname`
  - Add psycopg to requirements.txt: `psycopg-binary>=3.0.0`

### Model Files  
- If using ML models (joblib), ensure they're in backend folder
- Add to `.gitignore` (already done)
- Upload to cloud storage or include in Docker image

### Secrets
- Change `SECRET_KEY` to strong random value
- Never commit `.env` files
- Use Render's secret management

### CORS Origins
- For frontend on Vercel: `https://yourdomain.vercel.app`
- Multiple origins: `https://yourdomain.vercel.app,https://www.yourdomain.com`

### SSL/HTTPS
- Render provides free SSL certificates automatically

## 🔗 Useful Links

- Render Docs: https://render.com/docs/deploy-fastapi
- FastAPI Docs: https://fastapi.tiangolo.com/
- SQLAlchemy Async: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html

## 📝 Next Steps

1. Update frontend's API endpoint to Render backend URL
2. Test all API endpoints (auth, clients, dashboard, etc.)
3. Set up database migrations (if needed)
4. Monitor logs regularly
5. Set up alerts for failures

---
**Status**: ✅ Backend is ready for deployment on Render
