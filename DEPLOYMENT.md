# 🚀 Deployment Guide

This guide covers deploying FridgeChef to various platforms.

## 📋 Table of Contents
- [Vercel (Recommended)](#vercel-deployment)
- [Docker](#docker-deployment)
- [Traditional Server](#traditional-server-deployment)

---

## Vercel Deployment

Vercel is the recommended platform for deploying FridgeChef. It provides:
- Automatic HTTPS
- CDN for static files
- Serverless functions for API routes
- Free tier with generous limits

### Prerequisites
- GitHub account
- Vercel account (free at [vercel.com](https://vercel.com))
- Database setup (see [DATABASE_SETUP.md](./DATABASE_SETUP.md))

### Step 1: Prepare Your Repository

Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Configure Environment Variables

Before deploying, prepare your environment variables. You'll need:

```bash
# Required
DATABASE_URL=your-neon-database-url
OPENAI_API_KEY=your-openai-api-key
JWT_SECRET=your-jwt-secret

# Optional
NODE_ENV=production
```

### Step 3: Deploy to Vercel

#### Option A: Vercel Dashboard (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect the configuration
4. Add environment variables:
   - Click "Environment Variables"
   - Add `DATABASE_URL`, `OPENAI_API_KEY`, `JWT_SECRET`
5. Click "Deploy"

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow prompts to:
# - Link to existing project or create new
# - Configure project settings
# - Add environment variables

# Deploy to production
vercel --prod
```

### Step 4: Add Environment Variables via CLI

```bash
# Add secrets (recommended for sensitive data)
vercel env add DATABASE_URL production
vercel env add OPENAI_API_KEY production
vercel env add JWT_SECRET production

# Or add all at once
vercel env pull .env.production
# Edit .env.production with your values
vercel env push .env.production production
```

### Step 5: Verify Deployment

After deployment:
1. Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
2. Test the API: `https://your-project.vercel.app/api/health`
3. Try generating a recipe

### Troubleshooting Vercel

**API Routes Return 404**
- Ensure `api/serverless.cjs` exists
- Check `vercel.json` has correct rewrites
- Rebuild: `vercel --force`

**Database Connection Errors**
- Verify `DATABASE_URL` is set in Vercel environment
- Check database allows connections from Vercel IPs
- Neon databases work out of the box with Vercel

**Build Failures**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try local build: `npm run build`

---

## Docker Deployment

Deploy using Docker and Docker Compose for full control.

### Prerequisites
- Docker and Docker Compose installed
- `.env` file configured (copy from `.env.example`)

### Build and Run

```bash
# Build the Docker image
docker-compose build

# Start all services (app + redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Deployment

```bash
# Build for production
docker build -t fridgechef:latest .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e OPENAI_API_KEY="your-api-key" \
  -e JWT_SECRET="your-jwt-secret" \
  --name fridgechef \
  fridgechef:latest
```

### Docker Compose for Production

Update `docker-compose.yml` with your environment variables:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    restart: unless-stopped
```

---

## Traditional Server Deployment

Deploy to a VPS or dedicated server.

### Prerequisites
- Server with Node.js 22+ installed
- Nginx (recommended as reverse proxy)
- PM2 (for process management)
- PostgreSQL database

### Step 1: Setup Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### Step 2: Clone and Build

```bash
# Clone repository
git clone https://github.com/Chirag8405/FridgeChef_FSD.git
cd FridgeChef_FSD

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env  # Add your configuration

# Build application
npm run build
```

### Step 3: Start with PM2

```bash
# Start application
pm2 start dist/server/production.cjs --name fridgechef

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 4: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/fridgechef
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location /assets/ {
        proxy_pass http://localhost:3000/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/fridgechef /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### Step 6: Monitor Application

```bash
# View logs
pm2 logs fridgechef

# Monitor processes
pm2 monit

# Restart application
pm2 restart fridgechef

# Check status
pm2 status
```

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `OPENAI_API_KEY` | Yes | OpenAI API key | `sk-...` |
| `JWT_SECRET` | Yes | Secret for JWT tokens (32+ chars) | Generated with `openssl rand -base64 32` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `NODE_ENV` | No | Environment mode | `production` |

---

## Post-Deployment Checklist

- [ ] Application accessible at deployment URL
- [ ] Health check endpoint working: `/api/health`
- [ ] Database connection successful
- [ ] Recipe generation working
- [ ] User authentication working
- [ ] Static assets loading correctly
- [ ] HTTPS enabled (production)
- [ ] Environment variables secured
- [ ] Monitoring/logs configured
- [ ] Backups configured for database

---

## Performance Optimization

### Vercel
- Static assets are automatically cached on CDN
- Serverless functions scale automatically
- No additional configuration needed

### Docker/Server
1. **Enable Gzip Compression** (Nginx)
2. **Cache Static Assets** (already configured)
3. **Use Redis** for session storage (Docker Compose includes Redis)
4. **Monitor with PM2** or similar tools
5. **Database Connection Pooling** (already implemented with Neon)

---

## Troubleshooting

### Common Issues

**502 Bad Gateway (Nginx)**
```bash
# Check if app is running
pm2 status

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart fridgechef
sudo systemctl restart nginx
```

**Database Connection Errors**
```bash
# Test database connection
psql $DATABASE_URL

# Check if DATABASE_URL is set
pm2 env fridgechef | grep DATABASE_URL

# Update environment and restart
pm2 restart fridgechef --update-env
```

**Build Failures**
```bash
# Clear build cache
rm -rf dist node_modules
npm install
npm run build
```

---

## Continuous Deployment

### GitHub Actions (Vercel)

Vercel automatically deploys on git push. To customize:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Auto-Deploy on Server

```bash
# Create deploy script
cat > deploy.sh << 'EOF'
#!/bin/bash
cd /path/to/FridgeChef_FSD
git pull origin main
npm install
npm run build
pm2 restart fridgechef
EOF

chmod +x deploy.sh

# Setup webhook or cron job to run deploy.sh
```

---

## Support

If you encounter issues:
1. Check the [README](./README.md) for basic setup
2. Review [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database issues
3. Open an issue on [GitHub](https://github.com/Chirag8405/FridgeChef_FSD/issues)

---

Built with ❤️ by [Chirag](https://github.com/Chirag8405)
