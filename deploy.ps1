# NPTEL Vercel Deployment Script for Windows
Write-Host "🚀 Building NPTEL project for Vercel..." -ForegroundColor Green

# Install frontend dependencies
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Cyan
npm install --prefix frontend

# Install sanity dependencies
Write-Host "`n📦 Installing sanity dependencies..." -ForegroundColor Cyan
npm install --prefix sanity

# Build everything
Write-Host "`n🏗️  Building all projects..." -ForegroundColor Cyan
npm run build:all

Write-Host "`n✅ Build complete! Ready to deploy to Vercel" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: vercel"
Write-Host "2. After deployment, add your Vercel URL to Sanity CORS:"
Write-Host "   cd sanity"
Write-Host "   npx sanity cors add https://your-app.vercel.app --credentials"
