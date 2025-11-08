#!/usr/bin/env python3
"""
Simple script to view database contents
Usage: python view_database.py
"""

from app import app, db
from app import User, Profile, Transaction
from datetime import datetime

def format_date(date_str):
    """Format date string for display"""
    if isinstance(date_str, str):
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M:%S')
        except:
            return date_str
    return date_str

def view_database():
    with app.app_context():
        print("=" * 80)
        print("FINANCE TRACKER DATABASE VIEWER")
        print("=" * 80)
        print()
        
        # Users
        users = User.query.all()
        print(f"📊 USERS ({len(users)})")
        print("-" * 80)
        if users:
            for user in users:
                print(f"ID: {user.id}")
                print(f"  Username: {user.username}")
                print(f"  Email: {user.email}")
                print(f"  Created: {format_date(user.created_at.isoformat())}")
                print()
        else:
            print("  No users found")
        print()
        
        # Profiles
        profiles = Profile.query.all()
        print(f"📊 PROFILES ({len(profiles)})")
        print("-" * 80)
        if profiles:
            for profile in profiles:
                user = User.query.get(profile.user_id)
                print(f"ID: {profile.id}")
                print(f"  Name: {profile.name}")
                print(f"  User: {user.username if user else 'Unknown'} (ID: {profile.user_id})")
                print(f"  Created: {format_date(profile.created_at.isoformat())}")
                
                # Count transactions
                tx_count = Transaction.query.filter_by(profile_id=profile.id).count()
                print(f"  Transactions: {tx_count}")
                print()
        else:
            print("  No profiles found")
        print()
        
        # Transactions
        transactions = Transaction.query.order_by(Transaction.date.desc()).all()
        print(f"📊 TRANSACTIONS ({len(transactions)})")
        print("-" * 80)
        if transactions:
            for tx in transactions:
                profile = Profile.query.get(tx.profile_id)
                user = User.query.get(profile.user_id) if profile else None
                print(f"ID: {tx.id}")
                print(f"  Type: {tx.type.upper()}")
                print(f"  Amount: ${tx.amount:.2f}")
                print(f"  Category: {tx.category}")
                if tx.description:
                    print(f"  Description: {tx.description}")
                print(f"  Date: {tx.date}")
                print(f"  Profile: {profile.name if profile else 'Unknown'} (User: {user.username if user else 'Unknown'})")
                print(f"  Created: {format_date(tx.created_at.isoformat())}")
                print()
        else:
            print("  No transactions found")
        print()
        
        # Summary Statistics
        print("=" * 80)
        print("SUMMARY STATISTICS")
        print("=" * 80)
        print(f"Total Users: {len(users)}")
        print(f"Total Profiles: {len(profiles)}")
        print(f"Total Transactions: {len(transactions)}")
        
        if transactions:
            total_income = sum(tx.amount for tx in transactions if tx.type == 'income')
            total_expenses = sum(tx.amount for tx in transactions if tx.type == 'expense')
            balance = total_income - total_expenses
            
            print(f"Total Income: ${total_income:.2f}")
            print(f"Total Expenses: ${total_expenses:.2f}")
            print(f"Net Balance: ${balance:.2f}")
        print()

if __name__ == '__main__':
    view_database()

