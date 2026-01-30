# Deployment Guide

## Overview

This guide covers deploying the NPTEL Statistics Management System to production using various platforms.

## Prerequisites

- All services tested locally and working
- Sanity token with valid permissions
- Git repository (recommended)
- Account on your chosen deployment platform

## Option 1: Deploy on Vercel (Frontend) + Render (Backend)

### Frontend Deployment (Vercel)

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Click "New Project"
   - Select your GitHub repository
   - Root Directory: `frontend`
   - Click "Deploy"

4. **Update Frontend API URL**:
   - After deployment, note your Vercel domain (e.g., `nptel.vercel.app`)
   - Update `frontend/vite.config.js` proxy target to your backend URL:
   ```javascript
   proxy: {
     '/api': {
       target: 'https://your-backend-url',
       changeOrigin: true
     }
   }
   ```

### Backend Deployment (Render)

1. **Prepare backend**:
   ```bash
   cd backend
   npm install
   ```

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add backend"
   git push origin main
   ```

3. **Deploy to Render**:
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Configuration:
     - Name: `nptel-backend`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `node server.js`
     - Root Directory: `backend`
   - Add Environment Variables (click "Add Environment Variable"):
     ```
     SANITY_PROJECT_ID=1asbko6r
     SANITY_DATASET=production
     SANITY_API_VERSION=2024-01-30
     SANITY_TOKEN=your_token_here
     PORT=5000
     ```
   - Click "Create Web Service"

4. **Update Frontend**:
   - Note the Render backend URL (e.g., `nptel-backend.onrender.com`)
   - Update `frontend/vite.config.js`:
   ```javascript
   proxy: {
     '/api': {
       target: 'https://nptel-backend.onrender.com',
       changeOrigin: true
     }
   }
   ```
   - Redeploy frontend on Vercel

## Option 2: Docker Deployment (Comprehensive)

### Create Dockerfile for Backend

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### Create Dockerfile for Frontend

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      SANITY_PROJECT_ID: 1asbko6r
      SANITY_DATASET: production
      SANITY_API_VERSION: 2024-01-30
      SANITY_TOKEN: ${SANITY_TOKEN}
      PORT: 5000
    ports:
      - "5000:5000"
    restart: unless-stopped

  frontend:
    build: ./frontend
    environment:
      API_URL: http://backend:5000
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### Deploy with Docker

```bash
docker-compose up -d
```

## Option 3: AWS Deployment

### Deploy Backend on AWS Lambda with API Gateway

1. Install AWS CLI and configure credentials
2. Create serverless function:
   ```bash
   npm install -g serverless
   serverless create --template aws-nodejs --path nptel-backend
   ```

3. Install serverless express:
   ```bash
   npm install serverless-http
   ```

4. Update `server.js` to export handler:
   ```javascript
   import serverless from 'serverless-http';
   export const handler = serverless(app);
   ```

5. Deploy:
   ```bash
   serverless deploy
   ```

### Deploy Frontend on S3 + CloudFront

1. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Create S3 bucket and upload:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name/
   ```

3. Create CloudFront distribution pointing to S3

## Option 4: Railway.app Deployment

1. Go to https://railway.app
2. Click "New Project"
3. Select "GitHub Repo"
4. Add both backend and frontend services:
   - **Backend**:
     - Service: `NPTel Backend`
     - Start Command: `cd backend && node server.js`
     - Port: `5000`
     - Environment Variables: (add all from `.env`)
   
   - **Frontend**:
     - Service: `NPTEL Frontend`
     - Build Command: `cd frontend && npm run build`
     - Start Command: `npx http-server dist`
     - Port: `8080`

## Environment Configuration for Production

Ensure these environment variables are set on your deployment platform:

**Backend (.env)**:
```
SANITY_PROJECT_ID=1asbko6r
SANITY_DATASET=production
SANITY_API_VERSION=2024-01-30
SANITY_TOKEN=your_token_here
PORT=5000
NODE_ENV=production
```

**Frontend (in vite.config.js or build)**:
```
VITE_API_URL=https://your-backend-domain.com
```

## Post-Deployment

### 1. Verify Services
- Test frontend at deployment URL
- Test API endpoints:
  ```bash
  curl https://your-backend-domain.com/health
  ```

### 2. Monitor Logs
- Monitor frontend errors in browser console
- Monitor backend logs in your deployment platform
- Check Sanity for any data issues

### 3. Setup Custom Domain
- Point your domain to the deployment URLs
- Configure SSL/HTTPS (usually automatic)

### 4. Backup Strategy
- Sanity handles all database backups automatically
- Configure regular CSV exports for data backup
- Monitor disk space on backend

## Performance Optimization

### Frontend
- Enable gzip compression in Vite config
- Set up CDN for static assets
- Use lazy loading for components

### Backend
- Enable CORS caching
- Implement request caching
- Use connection pooling for Sanity

### Database (Sanity)
- Index frequently searched fields
- Archive old academic years
- Use GROQ query optimization

## Troubleshooting Deployment

### "Cannot connect to backend"
- Verify backend is running
- Check CORS configuration
- Verify API URL in frontend config

### "Sanity token invalid"
- Regenerate token in Sanity dashboard
- Update environment variables
- Redeploy services

### "Out of memory"
- Reduce upload file size limits
- Implement pagination for large datasets
- Scale up server resources

### "Slow API responses"
- Check Sanity query performance
- Implement caching
- Optimize CSV parsing
- Check server resource usage

## Monitoring

### Recommended Tools
- **Sentry**: Error tracking
- **Datadog**: Infrastructure monitoring
- **New Relic**: Application performance
- **LogRocket**: Frontend debugging

Setup example with Sentry:

```bash
npm install --save @sentry/node @sentry/tracing
```

Add to backend/server.js:
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

## Scaling Considerations

As your application grows:

1. **Database**: Sanity scales automatically
2. **Frontend**: Use CDN and edge caching
3. **Backend**: 
   - Implement request queuing
   - Use load balancing
   - Scale horizontally with multiple instances
4. **CSV Processing**: 
   - Implement background jobs for large uploads
   - Use message queues (RabbitMQ, SQS)

## Summary

| Platform | Frontend | Backend | Ease | Cost |
|----------|----------|---------|------|------|
| Vercel + Render | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Very Easy | Free tier available |
| Railway | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Easy | Free tier available |
| Docker Compose | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium | Depends on hosting |
| AWS | ⭐⭐⭐ | ⭐⭐⭐ | Hard | Pay-per-use |

Recommended for beginners: **Vercel + Render**

---

Questions? Check the README.md or QUICKSTART.md for more information.
