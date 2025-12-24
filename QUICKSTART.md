# ⚡ Quick Start Guide

Get the Strategic AI Roadmap Portal backend running in 5 minutes.

---

## Prerequisites

- Node.js 20+ with Corepack enabled (`corepack enable`)
- PostgreSQL database (get free one at https://neon.tech)

---

## Step 1: Install Dependencies

```bash
cd /home/tonycamero/code/Strategic_AI_Roadmaps

# Install all workspace dependencies
pnpm install

# Build shared types (required for backend)
pnpm --filter shared build
```

---

## Step 2: Set Up Database

### Get a Database URL

1. Go to https://neon.tech
2. Create free account
3. Create new project
4. Copy connection string

### Configure Environment

```bash
cd backend
cp .env.example .env

# Edit .env and add your database URL
nano .env  # or use your preferred editor
```

Your `.env` should look like:

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-random-secret-at-least-32-characters-long
RESEND_API_KEY=re_xxx  # Optional for now, emails won't send without it
FROM_EMAIL=onboarding@yourdomain.com
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

---

## Step 3: Initialize Database

```bash
# Still in backend directory

# Generate migration files
pnpm db:generate

# Push schema to database
pnpm db:push
```

You should see:
```
✓ Schema applied successfully
```

---

## Step 4: Start Backend Server

```bash
# Still in backend directory
pnpm dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
🔐 Environment: development
```

---

## Step 5: Test the API

### Test Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T20:00:00.000Z",
  "environment": "development"
}
```

### Register an Owner Account

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123",
    "name": "Test Owner"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "owner",
    "name": "Test Owner",
    "createdAt": "2025-11-19T20:00:00.000Z"
  }
}
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123"
  }'
```

### Create an Invite

```bash
# Replace YOUR_TOKEN with the token from register/login
curl -X POST http://localhost:3001/api/invites/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "ops@example.com",
    "role": "ops"
  }'
```

---

## 🎉 Success!

Your backend is now running with:

✅ **Database** connected (PostgreSQL via Neon)  
✅ **Authentication** working (JWT)  
✅ **API endpoints** operational  
✅ **RBAC** enforced (owner, ops, sales, delivery roles)

---

## Next Steps

### Option 1: Build Frontend

Follow `SPRINT_TICKETS.md` Tickets 8-15 to build the React frontend.

### Option 2: Explore the API

Check out `IMPLEMENTATION_GUIDE.md` for complete API documentation.

### Option 3: Use Drizzle Studio

Visual database explorer:

```bash
cd backend
pnpm db:studio
```

Opens at http://localhost:4983

---

## Common Issues

### "DATABASE_URL environment variable is not set"

Make sure you created `.env` file in `backend/` directory and it has valid `DATABASE_URL`.

### "Migration failed" or "Schema generation failed"

Check your database connection string. Neon URLs should end with `?sslmode=require`.

### "Email sending failed"

This is expected if you haven't set `RESEND_API_KEY`. The invite will be created but email won't send. For development, you can manually construct invite links.

### Port 3001 already in use

Change `PORT=3002` in your `.env` file.

---

## Development Workflow

```bash
# Terminal 1: Backend
cd backend
pnpm dev

# Terminal 2: Run database commands
cd backend
pnpm db:studio  # Visual DB explorer
pnpm db:generate  # After schema changes
pnpm db:push  # Apply schema changes

# Terminal 3: Test API
curl http://localhost:3001/health
```

---

## Project Commands Reference

```bash
# Root level
pnpm dev              # Run frontend + backend
pnpm build            # Build everything
pnpm frontend         # Run frontend only
pnpm backend          # Run backend only

# Backend specific
cd backend
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to DB
pnpm db:studio        # Open Drizzle Studio

# Shared types
cd shared
pnpm build            # Rebuild types after changes
```

---

**Need help?** Check `IMPLEMENTATION_GUIDE.md` or `SPRINT_TICKETS.md` for detailed documentation.
