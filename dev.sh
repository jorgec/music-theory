#!/bin/bash

# Music Theory Analyzer - Development Server
# This script starts the Vite development server

set -e  # Exit on error

echo "🎵 Music Theory Analyzer - Development Server"
echo "=============================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed"
    echo "Running installation first..."
    echo ""
    ./install.sh
    echo ""
fi

# Check if .env exists, if not suggest creating one
if [ ! -f ".env" ]; then
    echo "ℹ️  No .env file found"
    echo "You can create one from .env.example if needed:"
    echo "  cp .env.example .env"
    echo ""
fi

# Start the development server
echo "🚀 Starting development server..."
echo ""
echo "The app will be available at:"
echo "  → Local:   http://localhost:5173"
echo "  → Network: Check the output below"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
