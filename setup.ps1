# SyncSpace Setup Script for Windows
# Created by Rahul Vaishnav
# This script sets up the development environment for SyncSpace

Write-Host "🚀 Setting up SyncSpace - Real-Time Collaborative Workspace" -ForegroundColor Cyan
Write-Host "Created by Rahul Vaishnav" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js LTS first." -ForegroundColor Red
    exit 1
}

# Check npm version
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available." -ForegroundColor Red
    exit 1
}

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker is not installed. Some features may not work." -ForegroundColor Yellow
    Write-Host "   Please install Docker for full functionality." -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

# Copy environment file
Write-Host ""
Write-Host "⚙️  Setting up environment..." -ForegroundColor Cyan
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    Write-Host "   Please update the environment variables in .env" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Create necessary directories
Write-Host ""
Write-Host "📁 Creating directories..." -ForegroundColor Cyan
$directories = @("uploads", "logs", "temp")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}
Write-Host "✅ Created necessary directories" -ForegroundColor Green

# Setup git hooks (if husky is available)
if (Test-Path "node_modules/.bin/husky.cmd") {
    Write-Host ""
    Write-Host "🔧 Setting up git hooks..." -ForegroundColor Cyan
    npx husky install
    Write-Host "✅ Git hooks configured" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update environment variables in .env file" -ForegroundColor White
Write-Host "2. Start infrastructure: docker compose -f docker-compose.dev.yml up -d" -ForegroundColor White
Write-Host "3. Run database migrations: npm run db:migrate" -ForegroundColor White
Write-Host "4. Start development: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: README.md" -ForegroundColor Cyan
Write-Host "🐛 Issues: https://github.com/Rahulvaishnav108/CollaborativeWorkspaceREALTIMESYN/issues" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green