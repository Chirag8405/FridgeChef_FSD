# Manual DevOps Experiments Guide

Step-by-step manual instructions for running the FridgeChef deployment experiments.

## Experiment 1: Deploy Fullstack Apps using DevOps Tools + Docker

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key

### Step-by-Step Manual Process

#### 1. Setup Environment
```bash
# Copy environment template
cp .env.docker .env

# Edit with your API keys
nano .env
# Add: OPENAI_API_KEY=your-actual-key-here
```

#### 2. Start Docker Services
```bash
# Clean up any existing containers
docker-compose down --remove-orphans
docker system prune -f

# Build and start all services
docker-compose up --build -d

# Check status (wait ~30 seconds for startup)
docker-compose ps
```

#### 3. Verify Everything Works
```bash
# Check logs
docker-compose logs app
docker-compose logs postgres

# Test database
docker-compose exec postgres pg_isready -U fridgechef_user -d fridgechef

# Test API
curl http://localhost:3000/api/health

# Open browser to http://localhost:3000
```

#### 4. Screenshots Needed
1. Dockerfile content
2. docker-compose.yml content
3. Environment file (.env) - blur API keys
4. `docker-compose up --build` output
5. `docker images` list
6. `docker ps` running containers
7. App in browser (localhost:3000)
8. API health check response
9. `docker-compose logs app` output
10. Docker Desktop dashboard (if using)

#### 5. Useful Commands
```bash
# View all logs
docker-compose logs -f

# Restart service
docker-compose restart app

# Stop everything
docker-compose down

# Clean up
docker-compose down --volumes
docker system prune -a
```

---

## Experiment 2: CI/CD Deployment with GitHub Actions + Vercel

### Prerequisites  
- GitHub account
- Vercel account
- Database (Neon/Railway/other PostgreSQL)

### Step-by-Step Manual Process

#### 1. Setup Vercel Account
1. Go to https://vercel.com and sign up with GitHub
2. Install Vercel CLI: `npm install -g vercel`
3. Login: `vercel login`
4. Initialize project: `vercel` (follow prompts)

#### 2. Configure Database
- Use existing external PostgreSQL (Neon/Railway)
- Or create Vercel Postgres in dashboard
- Get DATABASE_URL connection string

#### 3. Set Environment Variables in Vercel
In Vercel Dashboard > Project Settings > Environment Variables:
- `NODE_ENV` = production
- `DATABASE_URL` = your database URL
- `OPENAI_API_KEY` = your OpenAI key  
- `JWT_SECRET` = random secure string

#### 4. Setup GitHub Actions
1. Get Vercel token: Account Settings > Tokens > Create
2. Get project info: `cat .vercel/project.json`
3. Add GitHub secrets (repo Settings > Secrets > Actions):
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID` 
   - `VERCEL_PROJECT_ID`

#### 5. Test Deployments
```bash
# Manual deploy
vercel --prod

# Push to trigger GitHub Actions
git add .
git commit -m "Setup Vercel deployment"
git push origin main

# Test PR preview
git checkout -b test-pr
echo "# Test" >> README.md
git add . && git commit -m "Test PR"
git push origin test-pr
# Create PR on GitHub
```

#### 6. Screenshots Needed
1. Vercel dashboard after signup
2. `vercel --version` in terminal
3. Project initialization prompts
4. vercel.json file content
5. Environment variables page
6. Database connection setup
7. GitHub secrets page
8. GitHub Actions workflow file
9. `vercel --prod` deployment output
10. GitHub Actions running
11. PR preview deployment comment
12. Production deployment URL
13. Lighthouse performance scores
14. Vercel deployments dashboard
15. Live app in browser

#### 7. Expected Results
- Auto-deploy on push to main
- Preview URLs for PRs
- Fast CDN performance  
- Lighthouse scores >90
- Serverless API functions working

### Troubleshooting

**Docker Issues:**
```bash
docker system prune -a -f
docker-compose down --volumes --remove-orphans
docker-compose up --build --force-recreate
```

**Vercel Issues:**
```bash
vercel ls          # Check project status
vercel logs        # View deployment logs  
vercel link        # Re-link project
```

**GitHub Actions Issues:**
- Check workflow file syntax
- Verify secrets are set correctly
- Check Actions tab for error details

---

## Success Criteria

**Experiment 1:** App runs at localhost:3000, database connects, all containers healthy, demonstrates fullstack deployment using Docker DevOps tools

**Experiment 2:** Automatic deployments work, preview deployments for PRs, good performance scores, complete CI/CD pipeline with GitHub Actions

---

## Key Files to Review
- `Dockerfile` - app containerization
- `docker-compose.yml` - multi-service orchestration  
- `vercel.json` - Vercel deployment config
- `.github/workflows/vercel-deploy.yml` - CI/CD pipeline
- `.env.docker` - environment template