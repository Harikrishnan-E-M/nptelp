# NPTEL Vercel Deployment Script for Windows
Write-Host "🚀 Testing build for Vercel..." -ForegroundColor Green

# Build everything
Write-Host "`n🏗️  Building all projects..." -ForegroundColor Cyan  
node scripts/build.mjs

Write-Host "`n✅ Build complete! Ready to deploy to Vercel" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Commit and push changes: git add . && git commit -m 'Fix Vercel deployment' && git push"
Write-Host "2. Redeploy on Vercel (it will auto-deploy from GitHub)"
Write-Host "3. After deployment, add your Vercel URL to Sanity CORS:"
Write-Host "   cd sanity"
Write-Host "   npx sanity cors add https://your-app.vercel.app --credentials"
