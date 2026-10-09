# SyncSpace - GitHub Deployment Script for Windows
# Created by Rahul Vaishnav
# This script initializes Git and pushes the project to GitHub

Write-Host "🚀 Deploying SyncSpace to GitHub" -ForegroundColor Cyan
Write-Host "Created by Rahul Vaishnav" -ForegroundColor Green
Write-Host "Repository: Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git version: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Initialize git repository if not already initialized
if (!(Test-Path ".git")) {
    Write-Host ""
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Add remote origin if not already added
try {
    $currentOrigin = git remote get-url origin 2>$null
    if ($currentOrigin) {
        Write-Host "✅ Remote origin already exists" -ForegroundColor Green
        Write-Host "   Current origin: $currentOrigin" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "🔗 Adding remote origin..." -ForegroundColor Cyan
    git remote add origin https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN.git
    Write-Host "✅ Remote origin added" -ForegroundColor Green
}

# Create .gitkeep files for empty directories
Write-Host ""
Write-Host "📂 Creating .gitkeep files for empty directories..." -ForegroundColor Cyan
Get-ChildItem -Directory -Recurse | Where-Object { (Get-ChildItem $_.FullName -Force).Count -eq 0 } | ForEach-Object {
    New-Item -Path "$($_.FullName)\.gitkeep" -ItemType File -Force | Out-Null
}
Write-Host "✅ .gitkeep files created" -ForegroundColor Green

# Add all files to staging
Write-Host ""
Write-Host "📋 Adding files to Git..." -ForegroundColor Cyan
git add .
Write-Host "✅ All files added to staging" -ForegroundColor Green

# Check if there are changes to commit
$hasChanges = git diff --cached --quiet; $LASTEXITCODE -eq 1
if (!$hasChanges) {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "💾 Creating initial commit..." -ForegroundColor Cyan
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

    Write-Host "✅ Initial commit created" -ForegroundColor Green
}

# Set default branch to main
Write-Host ""
Write-Host "🌟 Setting default branch to main..." -ForegroundColor Cyan
git branch -M main
Write-Host "✅ Default branch set to main" -ForegroundColor Green

# Push to GitHub
Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "   Repository: https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue with the push to GitHub..."

git push -u origin main

Write-Host ""
Write-Host "🎉 Successfully deployed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Your repository is now available at:" -ForegroundColor Cyan
Write-Host "   https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN" -ForegroundColor Blue
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit your GitHub repository" -ForegroundColor White
Write-Host "2. Set up GitHub Actions for CI/CD (optional)" -ForegroundColor White
Write-Host "3. Configure repository settings and branch protection" -ForegroundColor White
Write-Host "4. Add collaborators if needed" -ForegroundColor White
Write-Host ""
Write-Host "🌟 SyncSpace is now live on GitHub! 🌟" -ForegroundColor Green