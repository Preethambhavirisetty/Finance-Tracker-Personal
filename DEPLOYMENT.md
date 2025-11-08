# Deployment Guide - Finance Tracker

## 🚀 Deployment Options

### Recommended: Render (Free Tier Available)
- **Backend**: Render Web Service
- **Frontend**: Render Static Site or Vercel
- **Database**: Render PostgreSQL (free tier) or SQLite for simple deployments

### Alternative Options
1. **Vercel** (Frontend) + **Render/Railway** (Backend)
2. **Netlify** (Frontend) + **Fly.io** (Backend)
3. **Heroku** (Both - Paid after free tier removal)
4. **Railway** (Both - Good free tier)

## 📋 Pre-Deployment Checklist

- [ ] Update backend to use environment variables
- [ ] Configure CORS for production domain
- [ ] Set up production database (PostgreSQL recommended)
- [ ] Update frontend API URL for production
- [ ] Add environment variable files (`.env.example`)
- [ ] Test production build locally
- [ ] Set up SSL/HTTPS

## 🎯 Quick Start: Deploy to Render

### Step 1: Prepare Backend for Production

1. **Update `backend/app.py`** to use environment variables
2. **Create `backend/.env.example`** with required variables
3. **Update database configuration** for PostgreSQL (optional but recommended)

### Step 2: Deploy Backend to Render

1. Go to https://render.com
2. Create new account or sign in
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `finance-tracker-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && python app.py`
   - **Environment Variables**:
     - `SECRET_KEY`: Generate a random secret key
     - `FLASK_ENV`: `production`
     - `DATABASE_URL`: (Auto-provided if using Render PostgreSQL)

### Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `build`
   - **Environment Variables**:
     - `REACT_APP_API_URL`: Your Render backend URL (e.g., `https://finance-tracker-backend.onrender.com`)

### Step 4: Update Frontend API URL

Update `frontend/src/App.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
```

## 🗄️ Database Options

### Option 1: SQLite (Simple, Not Recommended for Production)
- Works for small applications
- Limited to single server
- No concurrent write support

### Option 2: PostgreSQL (Recommended)
- Better for production
- Supports concurrent users
- Render provides free PostgreSQL

### Option 3: SQLite with Backup (Hybrid)
- Use SQLite but add backup strategy
- Good for personal projects

## 📝 Deployment Steps for Render

### Backend Deployment

1. **Create `render.yaml`** (optional, for infrastructure as code)
2. **Update `backend/app.py`** for production settings
3. **Create `backend/requirements.txt`** (already exists)
4. **Set environment variables on Render dashboard**

### Frontend Deployment

1. **Update API URL** to use environment variable
2. **Build and test locally**: `npm run build`
3. **Deploy to Vercel/Netlify**
4. **Update CORS settings** in backend

## 🔐 Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key-here
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/dbname
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

## 🛠️ Production Configuration

### Backend Changes Needed:
1. Use environment variables for configuration
2. Disable debug mode
3. Configure CORS for production domain
4. Use PostgreSQL instead of SQLite
5. Set up proper logging
6. Add error handling

### Frontend Changes Needed:
1. Use environment variable for API URL
2. Build optimized production bundle
3. Configure for production domain

## 📚 Detailed Deployment Guides

See individual guides:
- `DEPLOY_RENDER.md` - Deploy to Render
- `DEPLOY_VERCEL.md` - Deploy frontend to Vercel
- `DEPLOY_RAILWAY.md` - Deploy to Railway
- `PRODUCTION_SETUP.md` - Production configuration

## 🧪 Test Production Build Locally

### Backend:
```bash
cd backend
export FLASK_ENV=production
export SECRET_KEY=test-secret-key
python app.py
```

### Frontend:
```bash
cd frontend
npm run build
npm install -g serve
serve -s build
```

## 🐛 Troubleshooting

### Common Issues:
1. **CORS errors**: Update CORS settings in backend
2. **Database connection**: Check DATABASE_URL
3. **Environment variables**: Ensure they're set correctly
4. **Build errors**: Check build logs
5. **API connection**: Verify API URL in frontend

## 🔒 Security Checklist

- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Use environment variables (never commit secrets)
- [ ] Set up database backups
- [ ] Enable rate limiting (optional)
- [ ] Set up monitoring (optional)

## 📞 Support

For deployment issues:
1. Check deployment logs
2. Verify environment variables
3. Test locally first
4. Check platform documentation

---

Ready to deploy? Start with the Render deployment guide!

