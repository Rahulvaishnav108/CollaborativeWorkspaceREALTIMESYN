#!/bin/bash

# SyncSpace Setup Script
# Created by Rahul Vaishnav
# This script sets up the development environment for SyncSpace

set -e

echo "🚀 Setting up SyncSpace - Real-Time Collaborative Workspace"
echo "Created by Rahul Vaishnav"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js LTS first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Some features may not work."
    echo "   Please install Docker for full functionality."
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Copy environment file
echo ""
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "   Please update the environment variables in .env"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp
echo "✅ Created necessary directories"

# Setup git hooks (if husky is available)
if [ -f "node_modules/.bin/husky" ]; then
    echo ""
    echo "🔧 Setting up git hooks..."
    npx husky install
    echo "✅ Git hooks configured"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update environment variables in .env file"
echo "2. Start infrastructure: docker compose -f docker-compose.dev.yml up -d"
echo "3. Run database migrations: npm run db:migrate"
echo "4. Start development: npm run dev"
echo ""
echo "📚 Documentation: README.md"
echo "🐛 Issues: https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN/issues"
echo ""
echo "Happy coding! 🚀"