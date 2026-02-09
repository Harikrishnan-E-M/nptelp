#!/bin/bash

# NPTEL Vercel Deployment Script
echo "🚀 Building NPTEL project for Vercel..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install --prefix frontend

# Install sanity dependencies
echo "📦 Installing sanity dependencies..."
npm install --prefix sanity

# Build everything
echo "🏗️  Building all projects..."
npm run build:all

echo "✅ Build complete! Ready to deploy to Vercel"
echo ""
echo "Next steps:"
echo "1. Run: vercel"
echo "2. After deployment, add your Vercel URL to Sanity CORS:"
echo "   cd sanity && npx sanity cors add https://your-app.vercel.app --credentials"
