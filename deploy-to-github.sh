#!/bin/bash

# SyncSpace - GitHub Deployment Script
# Created by Rahul Vaishnav
# This script initializes Git and pushes the project to GitHub

set -e

echo "🚀 Deploying SyncSpace to GitHub"
echo "Created by Rahul Vaishnav"
echo "Repository: Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN"
echo "=================================================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "✅ Git version: $(git --version)"

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo ""
    echo "📁 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Add remote origin if not already added
if ! git remote get-url origin &> /dev/null; then
    echo ""
    echo "🔗 Adding remote origin..."
    git remote add origin https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN.git
    echo "✅ Remote origin added"
else
    echo "✅ Remote origin already exists"
    echo "   Current origin: $(git remote get-url origin)"
fi

# Create .gitkeep files for empty directories
echo ""
echo "📂 Creating .gitkeep files for empty directories..."
find . -type d -empty -not -path "./.git/*" -exec touch {}/.gitkeep \;
echo "✅ .gitkeep files created"

# Add all files to staging
echo ""
echo "📋 Adding files to Git..."
git add .
echo "✅ All files added to staging"

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "⚠️  No changes to commit"
else
    echo ""
    echo "💾 Creating initial commit..."
    git commit -m "🎉 Initial commit: SyncSpace - Real-Time Collaborative Workspace

✨ Features:
- Complete monorepo structure with Next.js frontend and NestJS backend
- Real-time collaboration with Socket.IO and Redis
- User authentication and management system
- PostgreSQL database with Prisma ORM
- Docker containerization for development and production
- Modern UI with Tailwind CSS and shadcn/ui components
- Industry-standard security and validation
- Comprehensive documentation and setup scripts

🏗️ Architecture:
- Modular NestJS backend with feature-based modules
- Type-safe Next.js frontend with TypeScript
- Real-time communication infrastructure
- Production-ready Docker configurations
- Scalable database design with proper relationships

Created by Rahul Vaishnav
Repository: https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN"

    echo "✅ Initial commit created"
fi

# Set default branch to main
echo ""
echo "🌟 Setting default branch to main..."
git branch -M main
echo "✅ Default branch set to main"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
echo "   Repository: https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN"
echo ""
read -p "Press Enter to continue with the push to GitHub..."

git push -u origin main

echo ""
echo "🎉 Successfully deployed to GitHub!"
echo ""
echo "📍 Your repository is now available at:"
echo "   https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN"
echo ""
echo "Next steps:"
echo "1. Visit your GitHub repository"
echo "2. Set up GitHub Actions for CI/CD (optional)"
echo "3. Configure repository settings and branch protection"
echo "4. Add collaborators if needed"
echo ""
echo "🌟 SyncSpace is now live on GitHub! 🌟"