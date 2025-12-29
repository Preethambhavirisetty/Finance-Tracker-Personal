#!/bin/bash

echo "🚀 Finance Tracker Frontend Setup Script"
echo "========================================="
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/frontend" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend dependencies installed successfully"
    else
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "✅ Frontend dependencies already installed"
fi

# Start the React development server
echo ""
echo "🔧 Starting React development server on port 3000..."
echo "Frontend will be available at http://localhost:3000"
echo ""
npm start

