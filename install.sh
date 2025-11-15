#!/bin/bash

# Music Theory Analyzer - Installation Script
# This script installs all dependencies required to run the application

set -e  # Exit on error

echo "🎵 Music Theory Analyzer - Installation"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  • Run './dev.sh' to start the development server"
echo "  • Or run 'npm run dev' manually"
echo "  • Or run 'npm run build' to create a production build"
echo ""
