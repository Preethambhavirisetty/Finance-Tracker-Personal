#!/bin/bash
# Quick fix for database schema mismatch

echo "🔧 Fixing database schema..."
echo ""
echo "This will:"
echo "  1. Stop all services"
echo "  2. Remove old database (⚠️  deletes existing data)"
echo "  3. Restart with fresh database"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

cd ~/Finance-Tracker-Personal

echo "📦 Stopping services..."
docker compose down

echo "🗑️  Removing old database volume..."
docker volume rm finance-tracker-personal_postgres_data

echo "🚀 Starting services with fresh database..."
docker compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 45

echo "✅ Checking status..."
docker compose ps

echo ""
echo "🎉 Done! The database now has the correct schema."
echo ""
echo "Access your app at: http://3.235.31.140"
echo ""
echo "You can now register a new account!"

