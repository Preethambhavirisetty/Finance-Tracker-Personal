#!/usr/bin/env python3
"""
Export database data to CSV files
Usage: python export_data.py
"""

import csv
from app import app, db
from app import User, Profile, Transaction
from datetime import datetime

def export_to_csv():
    with app.app_context():
        # Export Users
        users = User.query.all()
        with open('users_export.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['ID', 'Username', 'Email', 'Created At'])
            for user in users:
                writer.writerow([
                    user.id,
                    user.username,
                    user.email,
                    user.created_at.isoformat()
                ])
        print(f"✅ Exported {len(users)} users to users_export.csv")
        
        # Export Profiles
        profiles = Profile.query.all()
        with open('profiles_export.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['ID', 'Name', 'User ID', 'User Username', 'Created At'])
            for profile in profiles:
                user = User.query.get(profile.user_id)
                writer.writerow([
                    profile.id,
                    profile.name,
                    profile.user_id,
                    user.username if user else 'Unknown',
                    profile.created_at.isoformat()
                ])
        print(f"✅ Exported {len(profiles)} profiles to profiles_export.csv")
        
        # Export Transactions
        transactions = Transaction.query.all()
        with open('transactions_export.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'ID', 'Profile ID', 'Profile Name', 'User Username',
                'Type', 'Amount', 'Category', 'Description', 'Date', 'Created At'
            ])
            for tx in transactions:
                profile = Profile.query.get(tx.profile_id)
                user = User.query.get(profile.user_id) if profile else None
                writer.writerow([
                    tx.id,
                    tx.profile_id,
                    profile.name if profile else 'Unknown',
                    user.username if user else 'Unknown',
                    tx.type,
                    tx.amount,
                    tx.category,
                    tx.description or '',
                    tx.date.isoformat(),
                    tx.created_at.isoformat()
                ])
        print(f"✅ Exported {len(transactions)} transactions to transactions_export.csv")
        
        print("\n📊 Export complete! Files created in the backend directory.")

if __name__ == '__main__':
    export_to_csv()

