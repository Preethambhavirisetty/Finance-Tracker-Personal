# Finance Tracker - Setup Complete! 🎉

## ✅ What Has Been Set Up

### Backend (Python Flask)
- ✅ Flask application with all API endpoints
- ✅ SQLAlchemy ORM with SQLite database
- ✅ User authentication (register, login, logout)
- ✅ Profile management
- ✅ Transaction management
- ✅ Virtual environment created and dependencies installed
- ✅ Backend running on **port 5001** (port 5000 is used by macOS AirPlay)

### Frontend (React)
- ✅ React application with all components
- ✅ Tailwind CSS (via CDN for simplicity)
- ✅ Lucide React icons
- ✅ All dependencies installed
- ✅ Configured to connect to backend on port 5001

### File Structure
```
finance-tracker/
├── backend/
│   ├── app.py                 # Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── venv/                  # Virtual environment
│   └── finance_tracker.db    # Database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.js            # React application
│   │   ├── index.js          # Entry point
│   │   └── index.css         # Styles
│   ├── public/
│   │   └── index.html        # HTML template
│   └── package.json          # Node dependencies
├── start-backend.sh          # Backend startup script
├── start-frontend.sh         # Frontend startup script
└── README.md                 # Documentation
```

## 🚀 How to Run the Application

### Step 1: Start the Backend

Open a terminal and run:
```bash
cd /Users/preethambhavirisetty/Desktop/finance-tracker
./start-backend.sh
```

Or manually:
```bash
cd backend
source venv/bin/activate
python app.py
```

The backend will start on **http://localhost:5001**

### Step 2: Start the Frontend

Open a **NEW terminal** (keep backend running) and run:
```bash
cd /Users/preethambhavirisetty/Desktop/finance-tracker
./start-frontend.sh
```

Or manually:
```bash
cd frontend
npm start
```

The frontend will start on **http://localhost:3000**

### Step 3: Use the Application

1. Open your browser and go to **http://localhost:3000**
2. Register a new account
3. Create a profile
4. Start adding transactions!

## 🔧 Important Notes

### Port Configuration
- **Backend**: Port 5001 (changed from 5000 because macOS AirPlay uses port 5000)
- **Frontend**: Port 3000 (default React port)

### Database
- The database file `finance_tracker.db` will be created automatically in the `backend/` directory
- All data is stored locally in SQLite

### Virtual Environment
- The backend uses a Python virtual environment located at `backend/venv/`
- Always activate it before running the backend: `source venv/bin/activate`

## 🧪 Testing

### Test Backend
```bash
curl http://localhost:5001/api/health
```
Should return: `{"status":"ok"}`

### Test Frontend
- Open http://localhost:3000 in your browser
- You should see the login/register screen

## 📝 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/check-auth` - Check authentication status

### Profiles
- `GET /api/profiles` - Get all profiles for current user
- `POST /api/profiles` - Create new profile
- `DELETE /api/profiles/<id>` - Delete profile

### Transactions
- `GET /api/profiles/<id>/transactions` - Get all transactions for profile
- `POST /api/profiles/<id>/transactions` - Create new transaction
- `DELETE /api/transactions/<id>` - Delete transaction

## 🐛 Troubleshooting

### Backend Issues
- **Port 5001 already in use**: Kill the process using port 5001 or change the port in `backend/app.py`
- **Module not found**: Make sure virtual environment is activated and dependencies are installed
- **Database errors**: Delete `backend/finance_tracker.db` to reset the database

### Frontend Issues
- **Styles not loading**: Make sure Tailwind CSS CDN is loaded (check browser console)
- **API connection errors**: Verify backend is running on port 5001
- **CORS errors**: Check that CORS is properly configured in `backend/app.py`

## 🎨 Features

- ✅ User authentication (register/login)
- ✅ Multiple profiles per user
- ✅ Income and expense tracking
- ✅ Category-based organization
- ✅ Real-time balance calculations
- ✅ Transaction history
- ✅ Category breakdown visualization
- ✅ Beautiful, responsive UI

## 📚 Next Steps

1. Start both servers (backend and frontend)
2. Register your first account
3. Create a profile
4. Start tracking your finances!

Enjoy your finance tracker! 💰✨

