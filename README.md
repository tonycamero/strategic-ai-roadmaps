# Strategic AI Roadmap Portal

A multi-role, multi-phase platform that enables business owners to invite their leadership team, capture structured pre-discovery data, deliver AI roadmaps, and onboard staff for training and execution.

## 🏗️ Project Structure

```
Strategic_AI_Roadmaps/
├── frontend/          # React + Vite + TypeScript + Tailwind + shadcn
├── backend/           # Node + Express + TypeScript + Drizzle + PostgreSQL
├── shared/            # Shared types and Zod schemas
├── infra/             # Deployment configuration
└── docs/              # Documentation and guides
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (with Corepack enabled)
- pnpm (via Corepack: `corepack enable`)
- PostgreSQL database (recommend Neon for development)

### Installation

```bash
# Clone and install dependencies
cd Strategic_AI_Roadmaps
pnpm install

# Build shared types first
pnpm --filter shared build
```

### Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your DATABASE_URL and other secrets
# Get a free PostgreSQL database from: https://neon.tech

# Generate database migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# Start backend server (http://localhost:3001)
pnpm dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies (if not already done from root)
pnpm install

# Start frontend dev server (http://localhost:5173)
pnpm dev
```

### Development

Run both frontend and backend simultaneously:

```bash
# From root directory
pnpm dev
```

## 📋 User Roles & Capabilities

### Owner
- Sign in / create account
- Invite Ops Lead / Sales Lead / Delivery Lead
- View intake submissions
- Download/print pre-call summary (PDF)
- Access Roadmap Hub

### Ops / Sales / Delivery Leads
- Accept invite via email
- Fill short intake form (5-7 questions)
- Submit role-specific data

### Staff (Phase 3 - Scaffold)
- Access training modules (placeholder)
- Mark modules complete (placeholder)

## 🗺️ Application Routes

```
/                     Landing + Login
/owner/dashboard      Owner dashboard with invite cards
/owner/invite         Invite team members
/invite/:token        Accept invitation (role-based)
/intake/ops           Operations Lead intake form
/intake/sales         Sales Lead intake form
/intake/delivery      Delivery Lead intake form
/owner/summary        Consolidated intake summary
/owner/roadmap        Roadmap viewer with PDF + opportunities map
/staff/onboarding     Staff onboarding (scaffold)
/staff/training       Training modules (scaffold)
```

## 🗄️ Database Schema

**Complete schema in:** `backend/src/db/schema.ts`

### Core Tables
- `users` — All user accounts (owner, ops, sales, delivery, staff)
- `invites` — Role-based invitation system with tokens
- `intakes` — JSONB storage for role-specific intake forms
- `roadmaps` — PDF storage and metadata
- `training_modules` — Training content (Phase 3 scaffold)
- `training_progress` — User progress tracking (Phase 3 scaffold)

## 🔧 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** + **shadcn/ui** for UI components
- **Wouter** for client-side routing
- **React Query** for data fetching
- **Zod** for validation

### Backend
- **Node.js** + **Express** with TypeScript
- **Drizzle ORM** for type-safe database queries
- **PostgreSQL** (Neon) for database
- **JWT** for authentication
- **Resend** for transactional emails
- **Zod** for request validation

### DevOps
- **pnpm workspaces** for monorepo management
- **Netlify** for frontend deployment
- **Netlify Functions** or **Railway** for backend
- **Neon** for managed PostgreSQL

## 📚 Documentation

- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** — Complete ticket-by-ticket implementation
- **[API Documentation](./docs/API.md)** — Backend API routes and schemas (coming soon)
- **[Deployment Guide](./docs/DEPLOYMENT.md)** — Production deployment checklist (coming soon)

## 🎯 Development Workflow

### Backend Development

```bash
# Generate migration after schema changes
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Open Drizzle Studio (DB GUI)
pnpm db:studio

# Run backend tests
pnpm --filter backend test
```

### Frontend Development

```bash
# Start dev server with HMR
pnpm --filter frontend dev

# Build for production
pnpm --filter frontend build

# Preview production build
pnpm --filter frontend preview

# Run frontend tests
pnpm --filter frontend test
```

## 📦 Scripts Reference

### Root Commands

```bash
pnpm dev              # Run frontend + backend concurrently
pnpm build            # Build all packages
pnpm frontend         # Run only frontend
pnpm backend          # Run only backend
pnpm db:generate      # Generate database migrations
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
```

## 🔐 Environment Variables

### Backend (.env)

```bash
DATABASE_URL=postgresql://...        # PostgreSQL connection string
JWT_SECRET=your-secret-key           # JWT signing secret
RESEND_API_KEY=re_xxxxx              # Resend API key for emails
FROM_EMAIL=onboarding@example.com    # From email address
FRONTEND_URL=http://localhost:5173   # Frontend URL for links
PORT=3001                            # Backend server port
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:3001   # Backend API URL
```

## 🚢 Deployment

### Backend Deployment (Netlify Functions)

1. Create Netlify site
2. Connect GitHub repository
3. Set build command: `pnpm --filter backend build`
4. Set publish directory: `backend/dist`
5. Add environment variables in Netlify dashboard
6. Deploy!

### Frontend Deployment (Netlify)

1. Create Netlify site
2. Connect GitHub repository
3. Set build command: `pnpm --filter frontend build`
4. Set publish directory: `frontend/dist`
5. Add environment variables
6. Deploy!

### Database Setup (Neon)

1. Create account at https://neon.tech
2. Create new project
3. Copy connection string
4. Add to backend `.env` as `DATABASE_URL`
5. Run `pnpm db:push` to create schema

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run backend tests only
pnpm --filter backend test

# Run frontend tests only
pnpm --filter frontend test

# Run tests in watch mode
pnpm test --watch
```

## 📝 Implementation Status

✅ **Phase 1: Acquisition Layer (Complete Backend)**
- [x] Database schema
- [x] Authentication system
- [x] Invite system with email
- [x] Role-based intake forms
- [ ] Frontend components
- [ ] Integration testing

🚧 **Phase 2: Roadmap Layer (In Progress)**
- [ ] PDF upload and storage
- [ ] Roadmap viewer component
- [ ] Opportunities map visualization
- [ ] Priority ranking system
- [ ] Export functionality

📋 **Phase 3: Adoption Layer (Scaffold Only)**
- [ ] Staff onboarding flow
- [ ] Training module system
- [ ] Progress tracking
- [ ] Certificate generation

## 🤝 Contributing

1. Create a new branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Private - All Rights Reserved

## 🔗 Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Neon PostgreSQL](https://neon.tech)
- [Resend Email API](https://resend.com)
- [Netlify Deployment](https://netlify.com)

## 📞 Support

For questions or issues, contact: tony@example.com

---

**Built with ❤️ for Strategic AI Roadmap Portal**
