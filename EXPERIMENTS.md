# DevOps Experiments for FridgeChef

Manual guides for running deployment experiments with this project.

## ✅ Successful Deployments

**Production Deployment**: https://fridge-chef-9yeboj3re-chirags-projects-f5adae37.vercel.app

**CI/CD Status**: ✅ GitHub Actions + Vercel pipeline working
**Docker Status**: ✅ Multi-container setup ready
**Database**: ✅ PostgreSQL + Redis containers configured

## What I'm Testing

**Experiment 1**: Deploy fullstack apps using DevOps tools + Docker. Get the entire stack running in containers locally.

**Experiment 2**: CI/CD deployment with GitHub Actions + Vercel. Automated deployment pipeline with serverless hosting.

---

## Experiment 1: Deploy Fullstack Apps using DevOps Tools + Docker

Manual steps to containerize the entire stack and deploy locally using Docker DevOps tools. Includes React frontend, Express backend, PostgreSQL database, and Redis for caching.

**Tech stack:**
- Docker and Docker Compose
- PostgreSQL container for the database  
- Redis container for caching
- Node.js Alpine images (smaller footprint)

### Manual Setup Steps:

#### Step 1: Prepare Environment
1. Check that Docker files exist:
```bash
ls -la Dockerfile docker-compose.yml .dockerignore .env.docker init.sql
```

2. Copy environment template:
```bash
cp .env.docker .env
```

3. Edit the .env file with your actual values:
```bash
nano .env
```
**Important**: Add your OpenAI API key to `OPENAI_API_KEY=your-key-here`

#### Step 2: Build and Run Containers
1. Check Docker is running:
```bash
docker --version
docker info
```

2. Clean up any existing containers:
```bash
docker-compose down --remove-orphans
docker system prune -f
```

3. Build and start services:
```bash
docker-compose up --build -d
```

4. Wait for services to start (about 30 seconds), then check status:
```bash
docker-compose ps
```

#### Step 3: Verify Everything Works
1. Check container logs:
```bash
docker-compose logs app
docker-compose logs postgres
```

2. Test database connection:
```bash
docker-compose exec postgres pg_isready -U fridgechef_user -d fridgechef
```

3. Test application:
```bash
curl http://localhost:3000/api/health
```

4. Open browser and navigate to: http://localhost:3000

### Screenshots to Take:

1. **Docker files content** (show Dockerfile and docker-compose.yml)
2. **Environment setup** (.env file with keys - blur sensitive data)
3. **Docker build process** (terminal output from docker-compose up)
4. **Docker images** (`docker images` command)
5. **Running containers** (`docker ps` or `docker-compose ps`)
6. **Application in browser** (localhost:3000)
7. **API health check** (curl response or browser at /api/health)
8. **Docker logs** (`docker-compose logs app`)
9. **Database connection** (pg_isready output)
10. **Docker Desktop dashboard** (if using Docker Desktop)

### Common Commands:
```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app

# Restart a service
docker-compose restart app

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down --volumes

# Get shell access to app container
docker-compose exec app sh

# Get shell access to database
docker-compose exec postgres psql -U fridgechef_user -d fridgechef
```

### Troubleshooting:
- If port 3000 is busy: `sudo lsof -i :3000` and kill the process
- If database won't start: Check if PostgreSQL is running locally on port 5432
- If build fails: Try `docker system prune -a` to clean everything

---

## Experiment 2: CI/CD Deployment with GitHub Actions + Vercel

Setting up automated CI/CD deployment pipeline to Vercel with GitHub Actions. Testing how Vercel handles a full-stack app through serverless functions.

**What this covers:**
- Automated CI/CD pipeline with GitHub Actions
- Serverless deployment on Vercel
- Preview deployments for pull requests
- Performance monitoring with Lighthouse
- Build optimizations for production

**Tech used:**
- Vercel platform and CLI
- GitHub Actions
- Serverless functions for API routes
- Lighthouse for performance testing

### Manual Setup Steps:

#### Step 1: Prepare Vercel Configuration
1. Check the Vercel config exists:
```bash
cat vercel.json
```

2. Review the GitHub Actions workflow:
```bash
cat .github/workflows/vercel-deploy.yml
```

#### Step 2: Setup Vercel Account and Project
1. Create account at https://vercel.com
2. Sign up with your GitHub account
3. Install Vercel CLI:
```bash
npm install -g vercel
```

4. Login and initialize project:
```bash
vercel login
```

5. Link this project to Vercel:
```bash
vercel
```
Follow prompts to create new project or link existing one.

#### Step 3: Configure Database
**Option A - Use external database (recommended):**
1. Keep using your existing Neon/Railway/other PostgreSQL
2. Get the DATABASE_URL connection string

**Option B - Vercel Postgres:**
1. Go to Vercel Dashboard > Storage > Create Database
2. Choose PostgreSQL
3. Copy the connection string

#### Step 4: Set Environment Variables
1. In Vercel Dashboard > Project Settings > Environment Variables, add:
   - `NODE_ENV` = production
   - `DATABASE_URL` = (your database connection)  
   - `OPENAI_API_KEY` = (your API key)
   - `JWT_SECRET` = (secure random string)

#### Step 5: Setup GitHub Actions
1. Get your Vercel token:
   - Go to Vercel Account Settings > Tokens
   - Create new token

2. Get project IDs:
```bash
cat .vercel/project.json
```

3. Add GitHub secrets (Settings > Secrets and variables > Actions):
   - `VERCEL_TOKEN` = (token from step 1)
   - `VERCEL_ORG_ID` = (from project.json)
   - `VERCEL_PROJECT_ID` = (from project.json)

#### Step 6: Test Deployment
1. Deploy manually first:
```bash
vercel --prod
```

2. Push to GitHub to trigger automated deployment:
```bash
git add .
git commit -m "Setup Vercel deployment"
git push origin main
```

3. Create a test PR to see preview deployment:
```bash
git checkout -b test-pr
echo "# Test" >> README.md
git add README.md
git commit -m "Test PR"
git push origin test-pr
```
Then create PR on GitHub.

### Screenshots to Take:

1. **Vercel account setup** (dashboard after signup)
2. **CLI installation** (terminal showing vercel --version)
3. **Project initialization** (vercel command prompts and responses)
4. **vercel.json configuration** (show file contents)
5. **Environment variables** (Vercel dashboard settings page)
6. **Database setup** (connection string configuration - blur sensitive data)
7. **GitHub secrets** (repository secrets page)
8. **GitHub Actions workflow** (show .github/workflows/vercel-deploy.yml)
9. **Manual deployment** (vercel --prod output)
10. **GitHub Actions running** (Actions tab during pipeline execution)
11. **Preview deployment** (PR comment with preview URL)
12. **Production deployment** (live app URL)
13. **Lighthouse results** (performance audit scores)
14. **Vercel dashboard** (deployments page showing successful builds)
15. **Live application** (browser showing app running on Vercel)

### Useful Commands:
```bash
# Check Vercel project status
vercel ls

# View deployment logs  
vercel logs

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Re-link project if needed
vercel link

# Remove project link
vercel unlink
```

### Expected Results:
- Automatic deployments when pushing to main
- Preview deployments for pull requests
- Fast global CDN delivery
- Serverless API endpoints
- Good Lighthouse performance scores (aim for >90)

**Important URLs:**
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Actions: https://github.com/Chirag8405/FridgeChef/actions
- Vercel Docs: https://vercel.com/docs

---

## How these compare

**Experiment 1 (Docker)**: Good for development and testing. Shows how to use Docker DevOps tools to containerize and deploy full-stack applications locally. Everything runs on your machine.

**Experiment 2 (Vercel CI/CD)**: Production-ready cloud deployment with automated CI/CD pipeline. Shows modern DevOps practices with GitHub Actions and serverless deployment.

---

## What counts as success

**Experiment 1**: App builds and runs at localhost:3000, database connects, all containers start properly, demonstrates fullstack deployment using Docker DevOps tools.

**Experiment 2**: GitHub Actions pipeline runs without errors, app deploys to Vercel, preview deployments work for PRs, decent performance scores, complete CI/CD workflow.

---

## If things go wrong

**Docker problems**: Usually fixed by cleaning up and rebuilding:
```bash
docker system prune -a -f
docker-compose down --volumes --remove-orphans
docker-compose up --build --force-recreate
```

**GitHub Actions failing**: Check the workflow file syntax and make sure secrets are set up right in repo settings.

**Vercel problems**: Try `vercel ls` to see project status, `vercel logs` for deployment logs, or `vercel link` to reconnect the project.

---

## After finishing these

You'll have experience with both local Docker deployment (DevOps tools) and cloud CI/CD deployment (GitHub Actions + Vercel). Good foundation for modern development workflows.

## Useful docs
- Docker: https://docs.docker.com/
- GitHub Actions: https://docs.github.com/en/actions  
- Vercel: https://vercel.com/docs