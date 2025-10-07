# FridgeChef - DevOps Experiments

A full-stack React + Express application for creating AI-powered recipes, used for DevOps deployment experiments.

## About the App

Transform your leftover ingredients into delicious recipes with AI. FridgeChef generates personalized recipes based on available ingredients using OpenAI's GPT.

## DevOps Experiments

This project demonstrates two key deployment approaches:

### Experiment 1: Deploy Fullstack Apps using DevOps Tools + Docker
- **Goal**: Local containerized deployment using Docker DevOps tools
- **Tech**: Docker, Docker Compose, PostgreSQL, Redis
- **Result**: Multi-container application running locally

### Experiment 2: CI/CD Deployment with GitHub Actions + Vercel  
- **Goal**: Automated cloud deployment pipeline
- **Tech**: GitHub Actions, Vercel, Serverless functions, Lighthouse
- **Result**: Production CI/CD pipeline with preview deployments

## Quick Start

### Docker Deployment (Experiment 1)
```bash
# Setup environment
cp .env.docker .env
nano .env  # Add your OPENAI_API_KEY

# Run with Docker
docker-compose up --build -d

# Access at http://localhost:3000
```

### Vercel CI/CD (Experiment 2)  
```bash
# Install Vercel CLI
npm install -g vercel

# Login and setup
vercel login
vercel

# Follow detailed setup in documentation
```

## Documentation

- **[EXPERIMENTS.md](./EXPERIMENTS.md)** - Detailed experiment guide with explanations and troubleshooting
- **[MANUAL_GUIDE.md](./MANUAL_GUIDE.md)** - Quick reference with step-by-step commands

## Project Structure

```
├── client/           # React frontend
├── server/           # Express backend  
├── shared/           # Shared types/utilities
├── .github/workflows/# GitHub Actions CI/CD
├── docker-compose.yml# Docker orchestration
├── Dockerfile        # Container configuration
├── vercel.json       # Vercel deployment config
└── init.sql          # Database initialization
```

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js  
- **Database**: PostgreSQL + Neon (cloud)
- **Cache**: Redis (Docker setup)
- **DevOps**: Docker + GitHub Actions + Vercel
- **AI**: OpenAI GPT for recipe generation

## Environment Variables

Required for both experiments:
```bash
OPENAI_API_KEY=your-openai-api-key
DATABASE_URL=your-postgres-connection-string  
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

## Success Criteria

**Experiment 1**: App runs at localhost:3000, all containers healthy, database connected

**Experiment 2**: Automated deployments work, preview deployments for PRs, good Lighthouse scores

---

Built for learning modern DevOps deployment strategies and cloud-native application development.