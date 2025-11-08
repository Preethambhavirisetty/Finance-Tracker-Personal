# Finance Tracker

A beautiful finance tracking application with user authentication, multiple profiles, and elegant design. Built with React frontend and Python Flask backend.

## Features

### Authentication
- User registration and login
- Secure password hashing
- Session-based authentication
- Multiple user support

### Finance Management
- Multiple profiles per user
- Track income and expenses
- Category-based organization
- Real-time balance calculations
- Transaction history with filtering
- Category breakdown visualization

### Design
- Clean white background
- Royal elegant typography (Playfair Display)
- Smooth animations and transitions
- Responsive design for all devices

## Project Structure

```
finance-tracker/
├── backend/
│   ├── app.py                 # Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── __init__.py           # Package initialization
│   └── .gitignore            # Backend gitignore
├── frontend/
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── src/
│   │   ├── App.js            # React application
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Styles with custom fonts
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── postcss.config.js     # PostCSS configuration
│   └── .gitignore            # Frontend gitignore
├── start-backend.sh          # Backend startup script
├── start-frontend.sh         # Frontend startup script
├── README.md                 # This file
└── .gitignore               # Root gitignore
```

## Tech Stack

**Frontend:**
- React 18 with Hooks
- Lucide React icons
- Tailwind CSS
- Create React App

**Backend:**
- Python Flask
- SQLAlchemy ORM
- SQLite database
- Flask-CORS for API communication

## Quick Start

### Prerequisites
- Python 3.7+ and pip
- Node.js 14+ and npm

### Step 1: Start the Backend

**Option A - Using the script (recommended):**
```bash
chmod +x start-backend.sh
./start-backend.sh
```

**Option B - Manual setup:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend will start on `http://localhost:5001` (Note: Port 5000 is typically used by macOS AirPlay Receiver)

### Step 2: Start the Frontend

Open a **new terminal** (keep the backend running):

**Option A - Using the script (recommended):**
```bash
chmod +x start-frontend.sh
./start-frontend.sh
```

**Option B - Manual setup:**
```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`

## Usage

### 1. Register/Login
- Open the app in your browser at `http://localhost:3000`
- Create a new account or login with existing credentials
- All passwords are securely hashed in the database

### 2. Create a Profile
- After logging in, create one or more finance profiles
- Each profile tracks its own separate finances
- Switch between profiles easily

### 3. Add Transactions
- Click "Add Transaction" to record income or expenses
- Choose the type (income/expense)
- Enter amount, category, date, and optional description
- View your transactions in the dashboard

### 4. Track Your Finances
- View total income, expenses, and net balance
- See category breakdowns
- Review transaction history
- Delete transactions as needed

## API Endpoints

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

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password_hash`: Hashed password
- `created_at`: Account creation timestamp

### Profiles Table
- `id`: Primary key
- `name`: Profile name
- `user_id`: Foreign key to Users
- `created_at`: Profile creation timestamp

### Transactions Table
- `id`: Primary key
- `profile_id`: Foreign key to Profiles
- `type`: 'income' or 'expense'
- `amount`: Transaction amount
- `category`: Transaction category
- `description`: Optional description
- `date`: Transaction date
- `created_at`: Record creation timestamp

## Security Features

- Password hashing using Werkzeug's security functions
- Session-based authentication
- CORS protection
- SQL injection prevention through SQLAlchemy ORM
- User data isolation (users can only access their own data)

## Troubleshooting

### Backend issues:
- Make sure port 5000 is not in use
- Verify all dependencies are installed: `pip list`
- Check if the database file has proper permissions
- Ensure you're using Python 3.7+

### Frontend issues:
- Clear browser cache if styles don't load
- Check browser console for errors
- Verify the backend is running on port 5001
- Ensure Node.js 14+ is installed
- Run `npm install` in the frontend directory if dependencies are missing

### Connection issues:
- Ensure CORS is properly configured
- Check that both frontend and backend are running
- Verify API_URL in the React component matches your backend URL (default: http://localhost:5001)
- Check browser console for CORS errors

## Development

### Backend Development
```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
python app.py
```

### Frontend Development
```bash
cd frontend
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Environment Variables

For production, set the following environment variable:
```bash
export SECRET_KEY='your-secret-key-here'
```

The backend uses this for session security. Change it from the default in production!

## License

MIT License - Feel free to use and modify as needed!

## Future Enhancements

- Export transactions to CSV/PDF
- Budget setting and tracking
- Recurring transactions
- Data visualization with charts
- Email notifications
- Multi-currency support
- Password reset functionality
- Two-factor authentication
