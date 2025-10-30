#!/bin/bash

# Trip Planner Backend - Startup Script

echo "🚀 Starting Trip Planner Backend..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check for API keys
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo ""
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set in environment"
    echo "   Make sure to set it in ../.env"
    echo ""
fi

# Run the server
echo "✅ Starting FastAPI server on port 4000..."
echo "📍 API will be available at: http://localhost:4000"
echo "📚 API docs available at: http://localhost:4000/docs"
echo ""
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 4000
