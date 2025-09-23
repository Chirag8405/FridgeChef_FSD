# Deployment Guide: Netlify + Neon

This guide covers deploying the FridgeChef application to Netlify with Neon PostgreSQL database.

## Prerequisites

1. **Netlify Account**: [Sign up at netlify.com](https://netlify.com)
2. **Neon Account**: [Sign up at neon.tech](https://neon.tech)
3. **OpenAI API Key**: [Get from platform.openai.com](https://platform.openai.com/api-keys)

## Database Setup (Neon)

### 1. Create Neon Database
1. Log into [Neon Console](https://console.neon.tech)
2. Click "Create Project"
3. Choose a project name (e.g., "FridgeChef-production")
4. Select your preferred region
5. Click "Create Project"

### 2. Get Database Connection String
1. In your Neon project dashboard, go to "Connection Details"
2. Copy the connection string format:
   ```
   postgresql://[username]:[password]@[hostname]/[database]?sslmode=require
   ```
3. Save this for Netlify environment variables

### 3. Database Schema Setup
The database tables will be automatically created when the app starts. The schema includes:
- `users` table for user management
- `recipes` table for storing generated recipes
- Proper indexes for performance

## Netlify Deployment

### 1. Connect Repository
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub, GitLab, etc.)
4. Select your FridgeChef repository

### 2. Build Settings
Netlify will automatically detect the settings from `netlify.toml`:
- **Build command**: `npm run build`
- **Publish directory**: `dist/spa`
- **Functions directory**: `netlify/functions`

### 3. Environment Variables
In Netlify Dashboard → Site Settings → Environment Variables, add:

```bash
# Required
DATABASE_URL=postgresql://username:password@hostname.neon.tech/dbname?sslmode=require
OPENAI_API_KEY=sk-your_openai_api_key_here

# Optional
NODE_ENV=production
PGBOUNCER=true
```

### 4. Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Your app will be available at `https://[random-name].netlify.app`

## Post-Deployment

### 1. Test Core Features
- ✅ Recipe generation works
- ✅ Like/dislike functionality
- ✅ Recipe history and filtering
- ✅ Profile settings
- ✅ Dark mode toggle

### 2. Custom Domain (Optional)
1. In Netlify Dashboard → Domain Settings
2. Add your custom domain
3. Configure DNS records as instructed

### 3. Performance Monitoring
- Check Netlify Analytics
- Monitor Neon database performance
- Review function execution logs

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check Netlify build logs
# Common fix: Clear build cache and retry
```

**Database Connection:**
```bash
# Verify DATABASE_URL format
# Ensure Neon database is active
# Check connection string syntax
```

**API Rate Limits:**
```bash
# Monitor OpenAI usage
# Implement rate limiting if needed
```

### Environment Variables Verification
```bash
# In Netlify Functions, check:
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('OPENAI_API_KEY set:', !!process.env.OPENAI_API_KEY);
```

## Security Checklist

- ✅ Environment variables secured
- ✅ Database connection uses SSL
- ✅ API endpoints validate inputs
- ✅ No sensitive data in client code
- ✅ Proper CORS configuration

## Cost Optimization

**Netlify:**
- Free tier: 100GB bandwidth, 300 build minutes
- Functions: 125,000 requests/month free

**Neon:**
- Free tier: 512MB storage, 1 project
- Automatic scaling and hibernation

**OpenAI:**
- Pay per token usage
- Monitor usage in OpenAI dashboard

## Support

For deployment issues:
- Check Netlify build logs
- Review Neon connection status
- Verify environment variables
- Test API endpoints in development

Your FridgeChef app will be production-ready with this setup! 🚀
