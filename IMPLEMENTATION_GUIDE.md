# Strategic AI Roadmap Portal — Implementation Guide

## Project Status

✅ **Completed:**
- Root monorepo structure
- Shared types package with Zod schemas
- Backend package.json with all dependencies
- Backend TypeScript configuration
- Database schema (Drizzle ORM) with all tables

🚧 **In Progress:**
- Backend API implementation
- Frontend application

---

## Architecture Overview

### Tech Stack

**Frontend:**
- React 18 + Vite + TypeScript
- TailwindCSS + shadcn/ui components
- Wouter for routing
- React Query for data fetching

**Backend:**
- Node.js + Express + TypeScript
- Drizzle ORM + PostgreSQL (Neon)
- JWT authentication
- Zod validation
- Resend for email

**Deployment:**
- Frontend: Netlify
- Backend: Netlify Functions or standalone
- Database: Neon

---

## Database Schema Complete ✅

Located in `backend/src/db/schema.ts`:

### Tables Created:
1. **users** — All user accounts (owner, ops, sales, delivery, staff)
2. **invites** — Role-based invitation system
3. **intakes** — JSONB storage for role-specific intake forms
4. **roadmaps** — PDF storage and metadata
5. **training_modules** — Training content (scaffold)
6. **training_progress** — User progress tracking (scaffold)

---

## Implementation Tickets

### Sprint 1: Core Infrastructure (Week 1)

#### Ticket 1: Database Connection & Migration Setup
**File:** `backend/src/db/index.ts`
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

**File:** `backend/src/db/migrate.ts`
```typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

**File:** `backend/drizzle.config.ts`
```typescript
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Commands:**
```bash
cd backend
pnpm db:generate  # Generate migration files
pnpm db:push      # Push schema to database
```

---

#### Ticket 2: Authentication Utilities
**File:** `backend/src/utils/auth.ts`
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function generateInviteToken(): string {
  const { nanoid } = require('nanoid');
  return nanoid(32);
}
```

---

#### Ticket 3: Authentication Middleware
**File:** `backend/src/middleware/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
```

---

#### Ticket 4: Email Service
**File:** `backend/src/utils/email.ts`
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@example.com';

export async function sendInviteEmail(params: {
  to: string;
  role: string;
  inviteLink: string;
  ownerName: string;
}) {
  const { to, role, inviteLink, ownerName } = params;

  const roleNames = {
    ops: 'Operations Lead',
    sales: 'Sales Lead',
    delivery: 'Delivery Lead',
  };

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You've been invited as ${roleNames[role as keyof typeof roleNames]}`,
    html: `
      <h2>You've been invited to join the Strategic AI Roadmap process</h2>
      <p>${ownerName} has invited you to participate as ${roleNames[role as keyof typeof roleNames]}.</p>
      <p><a href="${inviteLink}">Click here to accept your invitation</a></p>
      <p>This link will expire in 7 days.</p>
    `,
  });
}
```

---

#### Ticket 5: Auth Controller
**File:** `backend/src/controllers/auth.controller.ts`
```typescript
import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { LoginRequest } from '@roadmap/shared';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = LoginRequest.parse(req.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await comparePassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(400).json({ error: 'Invalid request' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create owner account
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        role: 'owner',
      })
      .returning();

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(400).json({ error: 'Registration failed' });
  }
}
```

---

### Sprint 2: Invite System (Week 1-2)

#### Ticket 6: Invite Controller
**File:** `backend/src/controllers/invite.controller.ts`
```typescript
import { Request, Response } from 'express';
import { db } from '../db';
import { invites, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateInviteToken, hashPassword, generateToken } from '../utils/auth';
import { sendInviteEmail } from '../utils/email';
import { AuthRequest } from '../middleware/auth';
import { CreateInviteRequest, AcceptInviteRequest } from '@roadmap/shared';

export async function createInvite(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create invites' });
    }

    const { email, role } = CreateInviteRequest.parse(req.body);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if invite already exists
    const [existingInvite] = await db
      .select()
      .from(invites)
      .where(and(eq(invites.email, email), eq(invites.ownerId, req.user.userId)))
      .limit(1);

    if (existingInvite && !existingInvite.accepted) {
      return res.status(400).json({ error: 'Invite already sent' });
    }

    const token = generateInviteToken();
    
    const [invite] = await db
      .insert(invites)
      .values({
        email,
        role,
        token,
        ownerId: req.user.userId,
        accepted: false,
      })
      .returning();

    // Get owner name for email
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    // Send invite email
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`;
    await sendInviteEmail({
      to: email,
      role,
      inviteLink,
      ownerName: owner.name,
    });

    return res.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      accepted: invite.accepted,
      createdAt: invite.createdAt,
    });
  } catch (error) {
    console.error('Create invite error:', error);
    return res.status(400).json({ error: 'Failed to create invite' });
  }
}

export async function acceptInvite(req: Request, res: Response) {
  try {
    const { token, name, password } = AcceptInviteRequest.parse(req.body);

    // Find invite
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.accepted) {
      return res.status(400).json({ error: 'Invite already accepted' });
    }

    // Create user account
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email: invite.email,
        passwordHash,
        name,
        role: invite.role,
      })
      .returning();

    // Mark invite as accepted
    await db
      .update(invites)
      .set({ accepted: true })
      .where(eq(invites.id, invite.id));

    const authToken = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return res.json({
      token: authToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return res.status(400).json({ error: 'Failed to accept invite' });
  }
}

export async function getInvites(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can view invites' });
    }

    const ownerInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.ownerId, req.user.userId));

    return res.json(ownerInvites);
  } catch (error) {
    console.error('Get invites error:', error);
    return res.status(500).json({ error: 'Failed to fetch invites' });
  }
}
```

---

### Sprint 3: Intake Forms (Week 2)

#### Ticket 7: Intake Controller
**File:** `backend/src/controllers/intake.controller.ts`
```typescript
import { Request, Response } from 'express';
import { db } from '../db';
import { intakes, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import { SubmitIntakeRequest } from '@roadmap/shared';

export async function submitIntake(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { role, answers } = SubmitIntakeRequest.parse(req.body);

    // Verify user role matches intake role
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Role mismatch' });
    }

    // Check if intake already exists
    const [existing] = await db
      .select()
      .from(intakes)
      .where(eq(intakes.userId, req.user.userId))
      .limit(1);

    if (existing) {
      // Update existing intake
      const [updated] = await db
        .update(intakes)
        .set({ answers, role })
        .where(eq(intakes.id, existing.id))
        .returning();

      return res.json(updated);
    }

    // Create new intake
    const [intake] = await db
      .insert(intakes)
      .values({
        userId: req.user.userId,
        role,
        answers,
      })
      .returning();

    return res.json(intake);
  } catch (error) {
    console.error('Submit intake error:', error);
    return res.status(400).json({ error: 'Failed to submit intake' });
  }
}

export async function getOwnerIntakes(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can view all intakes' });
    }

    // Get all users invited by this owner
    const ownerIntakes = await db
      .select({
        intake: intakes,
        user: users,
      })
      .from(intakes)
      .innerJoin(users, eq(intakes.userId, users.id));

    return res.json(ownerIntakes);
  } catch (error) {
    console.error('Get owner intakes error:', error);
    return res.status(500).json({ error: 'Failed to fetch intakes' });
  }
}

export async function getMyIntake(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [intake] = await db
      .select()
      .from(intakes)
      .where(eq(intakes.userId, req.user.userId))
      .limit(1);

    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }

    return res.json(intake);
  } catch (error) {
    console.error('Get intake error:', error);
    return res.status(500).json({ error: 'Failed to fetch intake' });
  }
}
```

---

### Sprint 4: Routes & Server (Week 2)

#### Ticket 8: API Routes
**File:** `backend/src/routes/auth.routes.ts`
```typescript
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);

export default router;
```

**File:** `backend/src/routes/invite.routes.ts`
```typescript
import { Router } from 'express';
import * as inviteController from '../controllers/invite.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/create', authenticate, requireRole('owner'), inviteController.createInvite);
router.post('/accept', inviteController.acceptInvite);
router.get('/list', authenticate, requireRole('owner'), inviteController.getInvites);

export default router;
```

**File:** `backend/src/routes/intake.routes.ts`
```typescript
import { Router } from 'express';
import * as intakeController from '../controllers/intake.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/submit', authenticate, intakeController.submitIntake);
router.get('/mine', authenticate, intakeController.getMyIntake);
router.get('/owner', authenticate, requireRole('owner'), intakeController.getOwnerIntakes);

export default router;
```

---

#### Ticket 9: Main Server File
**File:** `backend/src/index.ts`
```typescript
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import inviteRoutes from './routes/invite.routes';
import intakeRoutes from './routes/intake.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/intake', intakeRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

---

#### Ticket 10: Environment Configuration
**File:** `backend/.env.example`
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-secret-key-here-change-in-production

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=onboarding@yourdomain.com

# Frontend
FRONTEND_URL=http://localhost:5173

# Server
PORT=3001
```

---

## Frontend Implementation (Sprint 5-7)

The frontend requires 30+ files. Here's the critical path to get started:

### Next Steps for Frontend:

1. **Initialize Vite + React + TypeScript**
2. **Install dependencies** (tailwind, shadcn, wouter, @tanstack/react-query)
3. **Create routing structure**
4. **Build authentication context**
5. **Create page components for each route**
6. **Build form components for intake**
7. **Create dashboard layouts**

---

## Deployment Checklist

### Backend Deployment
- [ ] Set up Neon database
- [ ] Run migrations
- [ ] Deploy to Netlify Functions or Railway
- [ ] Configure environment variables
- [ ] Test API endpoints

### Frontend Deployment
- [ ] Build production bundle
- [ ] Deploy to Netlify
- [ ] Configure environment variables
- [ ] Test all flows end-to-end

---

## Testing Strategy

### Backend Tests
- Unit tests for utilities (auth, email)
- Integration tests for controllers
- End-to-end API tests

### Frontend Tests
- Component tests with Vitest
- Integration tests for forms
- E2E tests with Playwright

---

## Next Immediate Actions

Run these commands to get started:

```bash
# Install dependencies
pnpm install

# Build shared types
pnpm --filter shared build

# Set up backend database
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate and push database schema
pnpm db:generate
pnpm db:push

# Start backend dev server
pnpm dev
```

Then in another terminal:
```bash
# Initialize frontend (to be completed)
cd frontend
# Follow frontend setup guide
```

---

## Architecture Decisions

### Why Drizzle ORM?
- Type-safe queries
- Lightweight
- Great TypeScript support
- SQL-like syntax

### Why Monorepo?
- Shared types between frontend/backend
- Single deploy pipeline
- Easier development

### Why JWT?
- Stateless authentication
- Easy to scale
- Works well with serverless

---

## Support & Resources

- **Drizzle Docs:** https://orm.drizzle.team
- **shadcn/ui:** https://ui.shadcn.com
- **Neon:** https://neon.tech
- **Resend:** https://resend.com

---

Ready to proceed with frontend implementation? Say "continue with frontend" and I'll generate the complete frontend scaffolding.
