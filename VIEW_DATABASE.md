# How to View Database Data

## 📍 Database Location

The SQLite database is located at:
```
backend/instance/finance_tracker.db
```

## 🔍 Methods to View Data

### Method 1: Using the Python Viewer Script (Recommended)

I've created a simple Python script that displays all database contents in a readable format.

**Run the viewer:**
```bash
cd backend
source venv/bin/activate
python view_database.py
```

**What it shows:**
- All users (username, email, created date)
- All profiles (name, user, transaction count)
- All transactions (type, amount, category, date, description)
- Summary statistics (totals, balances)

### Method 2: Using SQLite Command Line

**View all tables:**
```bash
cd backend/instance
sqlite3 finance_tracker.db

# Then run these commands in SQLite:
.tables                    # List all tables
.schema                    # Show database structure
SELECT * FROM users;       # View all users
SELECT * FROM profiles;    # View all profiles
SELECT * FROM transactions; # View all transactions
.quit                      # Exit
```

**Quick queries:**
```bash
# View users
sqlite3 backend/instance/finance_tracker.db "SELECT * FROM users;"

# View profiles
sqlite3 backend/instance/finance_tracker.db "SELECT * FROM profiles;"

# View transactions
sqlite3 backend/instance/finance_tracker.db "SELECT * FROM transactions;"

# View transactions with profile names
sqlite3 backend/instance/finance_tracker.db "
SELECT 
    t.id, 
    t.type, 
    t.amount, 
    t.category, 
    t.date, 
    p.name as profile_name,
    u.username
FROM transactions t
JOIN profiles p ON t.profile_id = p.id
JOIN users u ON p.user_id = u.id
ORDER BY t.date DESC;
"
```

### Method 3: Using GUI Tools (Easiest)

#### Option A: DB Browser for SQLite (Free)
1. Download from: https://sqlitebrowser.org/
2. Install the application
3. Open `backend/instance/finance_tracker.db`
4. Browse tables, edit data, run queries

#### Option B: TablePlus (macOS, Paid/Free)
1. Download from: https://tableplus.com/
2. Open the database file
3. View and edit data with a beautiful interface

#### Option C: VS Code Extension
1. Install "SQLite Viewer" extension in VS Code
2. Right-click on `finance_tracker.db`
3. Select "Open Database"

### Method 4: Using Python Interactive Shell

```bash
cd backend
source venv/bin/activate
python
```

```python
from app import app, db
from app import User, Profile, Transaction

# Create app context
app.app_context().push()

# View users
users = User.query.all()
for user in users:
    print(f"{user.id}: {user.username} ({user.email})")

# View profiles
profiles = Profile.query.all()
for profile in profiles:
    user = User.query.get(profile.user_id)
    print(f"{profile.id}: {profile.name} (User: {user.username})")

# View transactions
transactions = Transaction.query.all()
for tx in transactions:
    print(f"{tx.id}: {tx.type} ${tx.amount} - {tx.category}")

# Get statistics
total_income = sum(tx.amount for tx in Transaction.query.filter_by(type='income').all())
total_expenses = sum(tx.amount for tx in Transaction.query.filter_by(type='expense').all())
print(f"Total Income: ${total_income}")
print(f"Total Expenses: ${total_expenses}")
print(f"Balance: ${total_income - total_expenses}")
```

## 📊 Database Schema

### Users Table
- `id` (Primary Key)
- `username` (Unique)
- `email` (Unique)
- `password_hash` (Hashed password)
- `created_at` (Timestamp)

### Profiles Table
- `id` (Primary Key)
- `name` (Profile name)
- `user_id` (Foreign Key to Users)
- `created_at` (Timestamp)

### Transactions Table
- `id` (Primary Key)
- `profile_id` (Foreign Key to Profiles)
- `type` ('income' or 'expense')
- `amount` (Float)
- `category` (String)
- `description` (Text, optional)
- `date` (Date)
- `created_at` (Timestamp)

## 🔧 Useful SQL Queries

### Get all transactions for a specific user
```sql
SELECT t.*, p.name as profile_name
FROM transactions t
JOIN profiles p ON t.profile_id = p.id
WHERE p.user_id = 1;
```

### Get total income and expenses by category
```sql
SELECT 
    category,
    type,
    SUM(amount) as total
FROM transactions
GROUP BY category, type
ORDER BY category, type;
```

### Get monthly summary
```sql
SELECT 
    strftime('%Y-%m', date) as month,
    type,
    SUM(amount) as total
FROM transactions
GROUP BY month, type
ORDER BY month DESC;
```

### Get user's balance
```sql
SELECT 
    u.username,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as balance
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN transactions t ON p.id = t.profile_id
WHERE u.id = 1
GROUP BY u.id;
```

## 📝 Current Database Status

Run this to see current status:
```bash
cd backend
source venv/bin/activate
python view_database.py
```

## 🛠️ Maintenance

### Backup Database
```bash
cp backend/instance/finance_tracker.db backend/instance/finance_tracker_backup.db
```

### Reset Database (WARNING: Deletes all data)
```bash
rm backend/instance/finance_tracker.db
# Restart the backend - it will create a new empty database
```

### Export to CSV
```bash
sqlite3 -header -csv backend/instance/finance_tracker.db "SELECT * FROM transactions;" > transactions.csv
sqlite3 -header -csv backend/instance/finance_tracker.db "SELECT * FROM profiles;" > profiles.csv
sqlite3 -header -csv backend/instance/finance_tracker.db "SELECT * FROM users;" > users.csv
```

## 💡 Tips

1. **Regular Backups**: Always backup your database before making changes
2. **Use the Viewer Script**: The `view_database.py` script is the easiest way to see all data
3. **GUI Tools**: For visual browsing, use DB Browser for SQLite
4. **API Endpoints**: You can also view data through the API endpoints (if authenticated)

## 🚀 Quick Start

The fastest way to view your data:
```bash
cd backend
source venv/bin/activate
python view_database.py
```

That's it! You'll see all your data in a nicely formatted output.

