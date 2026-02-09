#!/bin/bash

# NPTEL Vercel Deployment Script
echo "🚀 Building NPTEL project for Vercel..."

# Install all dependencies
echo "📦 Installing dependencies..."
node scripts/install.mjs

# Build everything
echo "🏗️  Building all projects..."
node scripts/build.mjs

echo "✅ Build complete! Ready to deploy to Vercel"
echo ""
echo "Next steps:"
echo "1. Run: vercel"
echo "2. After deployment, add your Vercel URL to Sanity CORS:"
echo "   cd sanity && npx sanity cors add https://your-app.vercel.app --credentials"
