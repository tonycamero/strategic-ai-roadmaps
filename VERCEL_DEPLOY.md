# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Scend Technologies team account
2. **Database**: Neon Serverless Postgres (recommended for Vercel)
3. **Email Service**: Resend API key

## Setup Steps

### 1. Install Vercel CLI (if not already installed)

```bash
pnpm add -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

Use your Scend Technologies account credentials.

### 3. Link Project to Vercel

```bash
vercel link
```

Select:
- **Scope**: `scend-technologies-hackathon-team` (or your team)
- **Project**: Create new project named `strategic-ai-roadmaps`

### 4. Set Environment Variables

Go to Vercel Dashboard > Project Settings > Environment Variables and add:

**Backend Variables:**
```
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
JWT_SECRET=your-production-secret-key-min-32-chars
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=onboarding@tonycamero.com
FRONTEND_URL=https://strategic-ai-roadmaps.vercel.app
NODE_ENV=production
```

**Frontend Variables:**
```
VITE_API_URL=https://strategic-ai-roadmaps.vercel.app
```

### 5. Deploy to Production

```bash
vercel --prod
```

Or push to main branch (if GitHub integration is enabled).

## Database Setup (Neon)

1. Go to https://neon.tech
2. Create new project: `strategic-ai-roadmaps`
3. Copy connection string
4. Add to Vercel environment variables as `DATABASE_URL`

### Run Migrations

After deploying, you need to run migrations. Options:

**Option A: Use Vercel CLI**
```bash
vercel env pull .env.production
cd backend
pnpm db:migrate
```

**Option B: Create a migration script endpoint (NOT RECOMMENDED FOR PRODUCTION)**
Add a protected admin endpoint that runs migrations.

**Option C: Manual via Neon Console**
Copy SQL from `backend/drizzle/` and run in Neon SQL Editor.

## Post-Deployment

1. Test the deployment: https://strategic-ai-roadmaps.vercel.app
2. Verify API health: https://strategic-ai-roadmaps.vercel.app/api/health
3. Seed demo data (Roberta Hayes firm) via SQL in Neon console
4. Login with Roberta's account: `roberta@hayesrealestate.com` / `password123`

## Architecture

- **Frontend**: Static SPA built with Vite (React + TypeScript)
- **Backend**: Serverless functions (Express.js wrapped for Vercel)
- **Database**: Neon Serverless Postgres
- **File Structure**:
  - `/frontend/dist` → Static assets
  - `/api/index.ts` → Serverless function handler
  - All `/api/*` routes → Proxied to serverless backend

## Troubleshooting

### Build fails with "Module not found"
- Ensure all dependencies are in `dependencies` not `devDependencies`
- Check workspace references in package.json

### Database connection fails
- Verify `DATABASE_URL` includes `?sslmode=require`
- Check Neon project is active and not sleeping

### API routes 404
- Verify `vercel.json` rewrites are correct
- Check `/api/health` endpoint first

## Rollback

```bash
vercel rollback
```

Select the previous deployment to restore.
