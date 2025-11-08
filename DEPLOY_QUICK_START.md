# Quick Deployment Guide - Finance Tracker

## 🚀 Fastest Way to Deploy (Render + Vercel)

### Prerequisites
- ✅ Code is on GitHub: https://github.com/Preethambhavirisetty/Finance-Tracker-Personal
- ✅ GitHub account
- ✅ Render account (free): https://render.com
- ✅ Vercel account (free): https://vercel.com

## Step 1: Deploy Backend to Render (5 minutes)

1. **Go to Render**: https://render.com
2. **Sign up/Login** with GitHub
3. **New +** → **Web Service**
4. **Connect repository**: `Finance-Tracker-Personal`
5. **Configure**:
   - Name: `finance-tracker-backend`
   - Region: `Oregon` (or closest to you)
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
6. **Environment Variables**:
   - `SECRET_KEY`: Click "Generate" or use: `openssl rand -hex 32`
   - `FLASK_ENV`: `production`
   - `PORT`: `$PORT` (auto-set by Render)
7. **Create Web Service**
8. **Wait for deployment** (~2-3 minutes)
9. **Copy your backend URL**: `https://finance-tracker-backend.onrender.com`

## Step 2: Create Database on Render (2 minutes)

1. **New +** → **PostgreSQL**
2. **Configure**:
   - Name: `finance-tracker-db`
   - Database: `finance_tracker`
   - Plan: `Free`
3. **Create Database**
4. **Copy Internal Database URL**
5. **Go back to your Web Service** → **Environment**
6. **Add**: `DATABASE_URL` = (paste the internal database URL)
7. **Redeploy** (automatic)

## Step 3: Deploy Frontend to Vercel (3 minutes)

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** with GitHub
3. **Add New Project**
4. **Import** `Finance-Tracker-Personal`
5. **Configure**:
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `build`
6. **Environment Variables**:
   - `REACT_APP_API_URL`: `https://finance-tracker-backend.onrender.com/api`
7. **Deploy**
8. **Wait for deployment** (~2 minutes)
9. **Copy your frontend URL**: `https://finance-tracker-xyz.vercel.app`

## Step 4: Update Backend CORS (1 minute)

1. **Go back to Render** → Your backend service
2. **Environment** tab
3. **Add/Update**: `CORS_ORIGINS` = `https://your-frontend-url.vercel.app`
4. **Save** (auto-redeploys)

## Step 5: Test Your App! 🎉

1. Open your Vercel frontend URL
2. Register a new account
3. Create a profile
4. Add transactions
5. Everything should work!

## 🔗 Your Live URLs

- **Frontend**: `https://your-frontend-url.vercel.app`
- **Backend**: `https://finance-tracker-backend.onrender.com`
- **API**: `https://finance-tracker-backend.onrender.com/api`

## 📝 Quick Commands

### Update Your Code
```bash
git add .
git commit -m "Your changes"
git push
```
Render and Vercel will auto-deploy!

### View Logs
- **Render**: Dashboard → Your service → Logs
- **Vercel**: Dashboard → Your project → Deployments → Logs

## 🐛 Troubleshooting

### Backend not working?
- Check Render logs
- Verify DATABASE_URL is set
- Check CORS_ORIGINS includes your frontend URL

### Frontend can't connect?
- Verify REACT_APP_API_URL is correct
- Check browser console for errors
- Verify backend CORS settings

### Database errors?
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Check database connection in Render dashboard

## 💰 Cost

- **Render Backend**: FREE (spins down after 15 min inactivity)
- **Render Database**: FREE (90 days, then $7/month)
- **Vercel Frontend**: FREE (unlimited)

## 🎊 You're Live!

Share your app URL with the world! 🚀

---

**Need help?** Check the detailed guides:
- `DEPLOY_RENDER.md` - Detailed Render deployment
- `DEPLOYMENT.md` - Full deployment guide

