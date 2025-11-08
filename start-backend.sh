#!/bin/bash

echo "🚀 Finance Tracker Backend Setup Script"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ pip3 found"

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Start the backend server
echo ""
echo "🔧 Starting Flask backend server on port 5001..."
echo "Note: Keep this terminal open. Open a new terminal for the frontend."
echo "Backend will be available at http://localhost:5001"
echo ""
python app.py
