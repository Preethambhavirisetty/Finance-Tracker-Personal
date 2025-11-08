# Deploy to Render - Step by Step Guide

## 🎯 Overview

This guide will help you deploy your Finance Tracker application to Render, which offers a free tier for both backend and database.

## 📋 Prerequisites

- GitHub account (your code is already on GitHub)
- Render account (free to create)
- Your repository: https://github.com/Preethambhavirisetty/Finance-Tracker-Personal

## 🗄️ Step 1: Set Up PostgreSQL Database (Recommended)

1. Go to https://render.com and sign in
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `finance-tracker-db`
   - **Database**: `finance_tracker`
   - **User**: (auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create Database"
5. **Save the connection string** - you'll need it later
   - Format: `postgresql://user:password@host:port/database`

## 🔧 Step 2: Update Backend for Production

### Update `backend/app.py` to use environment variables:

```python
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Use environment variables
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///finance_tracker.db').replace('postgres://', 'postgresql://')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CORS - Update with your frontend URL
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, supports_credentials=True, origins=CORS_ORIGINS)
```

### Create `backend/.env.example`:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@host:port/dbname
FLASK_ENV=production
PORT=5000
CORS_ORIGINS=https://your-frontend-url.vercel.app,https://your-frontend-url.netlify.app
```

## 🚀 Step 3: Deploy Backend to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select your repository: `Finance-Tracker-Personal`
5. Configure the service:
   - **Name**: `finance-tracker-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     python app.py
     ```
6. Click "Advanced" and add Environment Variables:
   - `SECRET_KEY`: Generate a random string (use `openssl rand -hex 32`)
   - `DATABASE_URL`: Copy from your PostgreSQL database (from Step 1)
   - `FLASK_ENV`: `production`
   - `CORS_ORIGINS`: Your frontend URL (you'll update this after deploying frontend)
7. Click "Create Web Service"
8. Wait for deployment (takes 2-5 minutes)
9. **Copy your backend URL** - e.g., `https://finance-tracker-backend.onrender.com`

## ⚛️ Step 4: Update Frontend for Production

### Update `frontend/src/App.js`:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
```

### Create `frontend/.env.example`:

```env
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

### Update `frontend/package.json` build script (if needed):

```json
{
  "scripts": {
    "build": "react-scripts build"
  }
}
```

## 🌐 Step 5: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New..." → "Project"
3. Import your repository: `Finance-Tracker-Personal`
4. Configure:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`
5. Add Environment Variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api` (from Step 3)
6. Click "Deploy"
7. Wait for deployment (takes 2-3 minutes)
8. **Copy your frontend URL** - e.g., `https://finance-tracker-xyz.vercel.app`

## 🔄 Step 6: Update Backend CORS

1. Go back to Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Update `CORS_ORIGINS`:
   - Add your Vercel frontend URL: `https://your-frontend-url.vercel.app`
5. Save and wait for redeployment

## ✅ Step 7: Test Your Deployment

1. Open your frontend URL in browser
2. Try to register a new account
3. Create a profile
4. Add a transaction
5. Verify everything works

## 🔧 Troubleshooting

### Backend Issues:

**Problem**: Database connection error
- **Solution**: Check DATABASE_URL is correct, ensure PostgreSQL is running

**Problem**: CORS errors
- **Solution**: Update CORS_ORIGINS with your frontend URL

**Problem**: 500 errors
- **Solution**: Check Render logs, verify environment variables

### Frontend Issues:

**Problem**: Can't connect to API
- **Solution**: Verify REACT_APP_API_URL is correct, check CORS settings

**Problem**: Build fails
- **Solution**: Check build logs, verify all dependencies are in package.json

## 📊 Monitoring

### Render:
- View logs in Render dashboard
- Monitor resource usage
- Check service health

### Vercel:
- View deployment logs
- Monitor analytics
- Check performance

## 🔄 Updating Your Application

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Render and Vercel will automatically redeploy

## 💰 Costs

- **Render Backend**: Free tier (spins down after 15 mins inactivity)
- **Render PostgreSQL**: Free tier (90 days, then $7/month)
- **Vercel Frontend**: Free tier (unlimited)

## 🎉 You're Deployed!

Your Finance Tracker is now live on:
- **Frontend**: https://your-frontend-url.vercel.app
- **Backend**: https://your-backend-url.onrender.com

Share your app with the world! 🚀

