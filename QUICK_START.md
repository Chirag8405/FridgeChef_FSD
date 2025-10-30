# 🚀 FridgeChef Database Setup - Quick Reference

## ⚡ Fastest Setup (5 minutes)

```bash
# 1. Run setup script
./setup-database.sh

# 2. Install & run
npm install && npm run build && npm start
```

## 🎯 Recommended: Neon PostgreSQL

### Get Started:
1. Go to **https://neon.tech**
2. Sign up (free - no credit card)
3. Create project → Copy connection string
4. Paste into `.env` file

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

## 📝 Required Environment Variables

```bash
# .env file
DATABASE_URL=postgresql://...          # From Neon/Supabase/Railway
OPENAI_API_KEY=sk-...                 # From platform.openai.com
JWT_SECRET=min-32-random-characters   # Generate with: openssl rand -base64 32
```

## ✅ Verify Setup

```bash
npm start                              # Start server
curl http://localhost:3000/api/health # Should show "connected"
```

## 📚 Full Documentation

- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Complete setup guide
- **[DATABASE_INTEGRATION_COMPLETE.md](./DATABASE_INTEGRATION_COMPLETE.md)** - What changed

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| `DATABASE_URL not set` | Check `.env` file exists and has correct variable name |
| `connection failed` | Verify connection string, add `?sslmode=require` |
| `relation does not exist` | Restart server to trigger schema initialization |

## 💰 Free Tiers

- **Neon**: 0.5 GB storage
- **Supabase**: 500 MB database
- **Railway**: $5 credit/month

---

**Need help?** Run `./setup-database.sh` for interactive setup!
