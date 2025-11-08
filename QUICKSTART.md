# Quick Setup Guide - Finance Tracker

## 🎯 What You Have

A complete finance tracking application with:
- ✅ User authentication (login/register)
- ✅ SQL database (SQLite)
- ✅ Python Flask backend
- ✅ React frontend with elegant royal design
- ✅ Multiple profiles per user
- ✅ Transaction tracking with categories

## 📁 Files Included

1. **backend/** - Python Flask server
   - `app.py` - Main Flask application with all API endpoints
   - `requirements.txt` - Python dependencies
   - Database will be auto-created as `finance_tracker.db`

2. **finance-tracker-with-auth.jsx** - Complete React frontend
3. **README.md** - Comprehensive documentation
4. **start-backend.sh** - Quick start script for backend

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Backend

**Option A - Using the script (recommended):**
```bash
cd outputs
./start-backend.sh
```

**Option B - Manual setup:**
```bash
cd outputs/backend
pip install -r requirements.txt
python app.py
```

The backend will start on http://localhost:5000
✅ You should see: "Running on http://127.0.0.1:5000"

### Step 2: Setup React Frontend

Open a NEW terminal (keep the backend running):

```bash
# Create a new React app
npx create-react-app my-finance-tracker
cd my-finance-tracker

# Install dependencies
npm install lucide-react

# Copy the React component
# Copy content from finance-tracker-with-auth.jsx to src/App.js
```

### Step 3: Add Custom Font

Update `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: 'Playfair Display', 'Georgia', serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Then start the React app:
```bash
npm start
```

## 🎉 You're Done!

The app should open at http://localhost:3000

### First Time Usage:

1. **Register** a new account
   - Username: your_username
   - Email: your_email@example.com
   - Password: your_secure_password

2. **Create a Profile** (e.g., "Personal", "Business")

3. **Add Transactions**
   - Click "Add Transaction"
   - Choose income or expense
   - Enter amount, category, date
   - Save!

## 🔧 Testing the Setup

**Test Backend:**
Open browser to http://localhost:5000/api/check-auth
You should see: `{"authenticated": false}`

**Test Frontend:**
- Registration page should load with elegant white design
- Login/Register tabs should be visible
- All text should be in Playfair Display font

## 📊 Database Location

The SQLite database is created automatically at:
`outputs/backend/finance_tracker.db`

You can view it with DB Browser for SQLite or any SQLite viewer.

## 🛠️ Common Issues & Solutions

### Issue: Port 5000 already in use
**Solution:** Stop other apps using port 5000, or modify the port in app.py (last line)

### Issue: CORS errors in browser
**Solution:** Make sure backend is running and check API_URL in React component

### Issue: Module not found errors
**Solution:** Run `pip install -r requirements.txt` again

### Issue: Can't see custom fonts
**Solution:** Clear browser cache and ensure Google Fonts import is in index.css

## 🎨 Design Features

- **White background** with subtle gradients
- **Playfair Display font** for royal elegance
- **Color-coded stats cards:**
  - Green for income
  - Red for expenses
  - Blue for balance
- **Smooth animations** on all interactions
- **Responsive design** works on mobile & desktop

## 🔐 Security Features

- Passwords are hashed (never stored in plain text)
- Session-based authentication
- SQL injection protection via ORM
- User data isolation
- CORS protection

## 📱 Features Overview

### Authentication
- Secure registration with email validation
- Login with username/password
- Session persistence (7 days)
- Logout functionality

### Profile Management
- Create multiple profiles (Personal, Business, etc.)
- Switch between profiles
- Delete profiles (removes all transactions)

### Transaction Tracking
- Add income/expense transactions
- Categorize transactions
- Add descriptions and dates
- View real-time balance
- Delete transactions

### Dashboard
- Total income display
- Total expenses display
- Net balance calculation
- Category breakdown
- Transaction history (sorted by date)

## 🎯 Next Steps

Once everything is running:
1. Create your first account
2. Make a profile
3. Add some transactions
4. Explore the beautiful interface!

## 💡 Pro Tips

- Create separate profiles for different purposes (Personal, Business, Savings)
- Use consistent categories for better tracking
- Add descriptions to remember what transactions were for
- Check your balance regularly
- Review category breakdown to see spending patterns

## 📞 Need Help?

Check the full README.md for:
- Complete API documentation
- Database schema details
- Advanced configuration options
- Troubleshooting guide

---

**Enjoy tracking your finances in style! 💰✨**
