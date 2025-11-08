# Database Guide - Quick Reference

## 📍 Database Location
```
backend/instance/finance_tracker.db
```

## 🚀 Quick View (Easiest Method)

```bash
cd backend
source venv/bin/activate
python view_database.py
```

This will show:
- All users
- All profiles  
- All transactions
- Summary statistics

## 📊 Current Data

Based on the last check, your database contains:
- **1 User**: Preetham (preethambhavirisetty66@gmail.com)
- **0 Profiles**: Create a profile in the app to start tracking
- **0 Transactions**: Add transactions after creating a profile

## 🎯 Next Steps

1. **Open the app**: http://localhost:3000
2. **Login** with your account
3. **Create a profile** (e.g., "Personal", "Business")
4. **Add transactions** (income/expenses)
5. **View data** using the methods below

## 🔍 View Data Methods

### 1. Python Script (Recommended)
```bash
cd backend
source venv/bin/activate
python view_database.py
```

### 2. SQLite Command Line
```bash
sqlite3 backend/instance/finance_tracker.db
.tables
SELECT * FROM users;
SELECT * FROM profiles;
SELECT * FROM transactions;
.quit
```

### 3. GUI Tool (DB Browser for SQLite)
- Download: https://sqlitebrowser.org/
- Open: `backend/instance/finance_tracker.db`

### 4. Export to CSV
```bash
cd backend
source venv/bin/activate
python export_data.py
```

## 📝 Useful Commands

**View database file size:**
```bash
ls -lh backend/instance/finance_tracker.db
```

**Backup database:**
```bash
cp backend/instance/finance_tracker.db backend/instance/finance_tracker_backup.db
```

**Check database integrity:**
```bash
sqlite3 backend/instance/finance_tracker.db "PRAGMA integrity_check;"
```

## 🔗 Related Files

- `backend/view_database.py` - View all data
- `backend/export_data.py` - Export to CSV
- `VIEW_DATABASE.md` - Detailed guide

For more details, see `VIEW_DATABASE.md`

