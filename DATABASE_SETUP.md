# Database Setup Guide for FridgeChef

This guide will walk you through setting up a cloud PostgreSQL database for FridgeChef using Neon.

## Option 1: Neon PostgreSQL (Recommended - Already Integrated)

### Why Neon?
- ✅ Free tier available (0.5 GB storage)
- ✅ Serverless PostgreSQL
- ✅ Fast setup (< 5 minutes)
- ✅ Auto-scaling
- ✅ Already integrated with `@neondatabase/serverless`

### Steps to Set Up Neon:

1. **Sign up for Neon**
   - Go to [https://neon.tech](https://neon.tech)
   - Click "Sign Up" (free - no credit card required)
   - Sign up with GitHub, Google, or email

2. **Create a New Project**
   - Click "Create Project"
   - Name: `FridgeChef` (or your preferred name)
   - Region: Choose closest to your users (e.g., US East, EU Central, Asia Pacific)
   - PostgreSQL version: 16 (recommended)
   - Click "Create Project"

3. **Get Your Connection String**
   - After project creation, you'll see a connection string
   - It looks like: `postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require`
   - Copy this entire string

4. **Add to Your Environment Variables**
   
   **For Local Development:**
   Create or update `.env` file in the root directory:
   ```bash
   DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   OPENAI_API_KEY=your_openai_key_here
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

   **For Production (Vercel/Netlify):**
   - Go to your deployment dashboard
   - Navigate to Settings → Environment Variables
   - Add:
     - Key: `DATABASE_URL`
     - Value: Your Neon connection string
   - Redeploy your application

5. **Initialize Database Schema**
   ```bash
   npm run build:server
   npm start
   ```
   The schema will be automatically created on first run.

6. **Verify Database Connection**
   - Check terminal output for: `✅ Database connection established successfully`
   - Visit: `http://localhost:3000/api/health`
   - Should show database status as "connected"

---

## Option 2: Supabase PostgreSQL (Alternative)

### Why Supabase?
- ✅ Free tier (500 MB database, 2 GB storage)
- ✅ Built-in authentication (optional)
- ✅ Real-time subscriptions
- ✅ Built-in admin dashboard

### Steps to Set Up Supabase:

1. **Sign up for Supabase**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up with GitHub
   - Create a new project

2. **Get Connection String**
   - Go to Settings → Database
   - Find "Connection string" section
   - Copy the "Connection pooling" URL (for serverless)
   - Replace `[YOUR-PASSWORD]` with your database password

3. **Update Code for Supabase**
   Add to `.env`:
   ```bash
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

4. **Initialize Schema**
   Same as Neon - run the app and it will create tables automatically.

---

## Option 3: Railway PostgreSQL

### Steps:
1. Go to [https://railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the `DATABASE_URL` from variables
4. Add to your `.env` file

---

## Database Schema

FridgeChef automatically creates these tables:

### Tables:
- **users** - User accounts and profiles
- **recipes** - Generated recipes
- **sessions** - Authentication sessions
- **user_ingredients** - User's pantry items
- **recipe_ratings** - Recipe reviews and ratings
- **recipe_likes** - User recipe likes

### Automatic Features:
- UUID primary keys
- Timestamps for all records
- Cascading deletes for related data
- Indexes for performance
- JSON fields for flexible data storage

---

## Environment Variables Reference

Create a `.env` file with:

```bash
# Database (Required for persistence)
DATABASE_URL=postgresql://user:password@host:5432/database

# OpenAI (Required for AI recipe generation)
OPENAI_API_KEY=sk-...

# Authentication (Required)
JWT_SECRET=your-super-secret-key-min-32-characters-long

# Server (Optional)
PORT=3000
NODE_ENV=production
```

---

## Troubleshooting

### Error: "DATABASE_URL not set"
- ✅ Check `.env` file exists in root directory
- ✅ Verify DATABASE_URL is spelled correctly
- ✅ Restart the server after adding .env

### Error: "Database connection failed"
- ✅ Verify connection string is correct
- ✅ Check if database is active (not paused)
- ✅ Ensure your IP is allowed (some providers require whitelisting)
- ✅ Check if SSL is required (add `?sslmode=require` to connection string)

### Error: "relation does not exist"
- ✅ Database schema not initialized
- ✅ Restart server to trigger automatic initialization
- ✅ Check terminal logs for initialization errors

### TypeScript Errors
- If you see type errors about `.length` or `.unsafe`:
  - These are fixed in the latest code
  - Run `npm run build` to rebuild

---

## Testing Database Connection

After setup, test with:

```bash
# 1. Start server
npm start

# 2. Check health endpoint
curl http://localhost:3000/api/health

# 3. Register a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# 4. Generate a recipe
curl -X POST http://localhost:3000/api/recipes/generate \
  -H "Content-Type: application/json" \
  -H "user-id: guest-user" \
  -d '{"ingredients":["chicken","rice","vegetables"]}'
```

---

## Next Steps

After database is connected:
1. ✅ Database persistence enabled
2. ✅ User authentication working
3. ✅ Recipe history saved
4. ✅ User preferences stored
5. ✅ Profile management working

---

## Cost Estimates

### Free Tiers:
- **Neon**: 0.5 GB storage, 3 GB transfer/month - FREE
- **Supabase**: 500 MB database, 2 GB storage, 2 GB transfer - FREE
- **Railway**: $5 credit/month - Effectively FREE for small apps

### Paid Plans (if you outgrow free tier):
- **Neon**: $19/month (3 GB storage, unlimited transfer)
- **Supabase**: $25/month (8 GB database, 100 GB storage)
- **Railway**: Pay-as-you-go ($0.000463/GB-hour for database)

---

## Security Best Practices

1. **Never commit `.env` to git** - Already in `.gitignore`
2. **Use strong JWT_SECRET** - Min 32 characters, random
3. **Rotate database passwords** - Every 90 days
4. **Enable SSL** - Always use `sslmode=require`
5. **Limit database access** - Use read-only users for reporting
6. **Monitor usage** - Set up alerts for quota limits

---

## Migration from Mock Data

If you already have recipes stored locally:
1. Database will start fresh
2. Old mock data won't be migrated
3. Users need to regenerate recipes
4. Consider adding a data export/import feature

---

**Need Help?**
- Neon Docs: https://neon.tech/docs
- Supabase Docs: https://supabase.com/docs
- Railway Docs: https://docs.railway.app
