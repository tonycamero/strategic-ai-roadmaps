# Strategic AI Roadmap Portal — Sprint Tickets

Use these tickets with Warp to build the application systematically.

## ✅ COMPLETED

- [x] Project structure (monorepo with frontend/backend/shared)
- [x] Shared types package with Zod schemas
- [x] Database schema (Drizzle ORM)
- [x] Database connection setup
- [x] Authentication utilities
- [x] Email service
- [x] Authentication middleware
- [x] Auth controller

## 🎯 CURRENT SPRINT: Backend Core (Days 1-3)

### Ticket 1: Complete Invite Controller
**Prompt for Warp:**
```
Create file: backend/src/controllers/invite.controller.ts

Implement three functions:
1. createInvite(req: AuthRequest, res: Response) - Create and send invitation email
2. acceptInvite(req: Request, res: Response) - Accept invitation and create user account
3. getInvites(req: AuthRequest, res: Response) - List all invites for owner

Requirements:
- Check if user/invite already exists
- Generate unique invite token
- Send email using sendInviteEmail utility
- Mark invite as accepted when user account created
- Return proper error responses

Use Drizzle ORM with db from '../db'
Use types from '@roadmap/shared'
```

---

### Ticket 2: Complete Intake Controller
**Prompt for Warp:**
```
Create file: backend/src/controllers/intake.controller.ts

Implement three functions:
1. submitIntake(req: AuthRequest, res: Response) - Submit or update intake form
2. getOwnerIntakes(req: AuthRequest, res: Response) - Get all intakes for owner
3. getMyIntake(req: AuthRequest, res: Response) - Get current user's intake

Requirements:
- Verify user role matches intake role
- Update existing intake or create new one
- Join with users table when fetching owner intakes
- Return proper error responses

Use Drizzle ORM with db from '../db'
Use types from '@roadmap/shared'
```

---

### Ticket 3: Create Route Files
**Prompt for Warp:**
```
Create three route files:

1. backend/src/routes/auth.routes.ts
   - POST /login → authController.login
   - POST /register → authController.register

2. backend/src/routes/invite.routes.ts
   - POST /create → inviteController.createInvite (auth + owner only)
   - POST /accept → inviteController.acceptInvite (public)
   - GET /list → inviteController.getInvites (auth + owner only)

3. backend/src/routes/intake.routes.ts
   - POST /submit → intakeController.submitIntake (auth)
   - GET /mine → intakeController.getMyIntake (auth)
   - GET /owner → intakeController.getOwnerIntakes (auth + owner only)

Use Express Router
Import middleware from '../middleware/auth'
Import controllers from '../controllers/*'
```

---

### Ticket 4: Create Main Server File
**Prompt for Warp:**
```
Create file: backend/src/index.ts

Requirements:
- Express server with TypeScript
- CORS enabled
- JSON body parser
- Health check endpoint at GET /health
- Mount routes:
  - /api/auth → authRoutes
  - /api/invites → inviteRoutes
  - /api/intake → intakeRoutes
- Error handling middleware
- Start server on PORT from env (default 3001)

Load environment variables with dotenv
```

---

### Ticket 5: Create Environment Files
**Prompt for Warp:**
```
Create two files:

1. backend/.env.example
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key-here-change-in-production
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=onboarding@yourdomain.com
FRONTEND_URL=http://localhost:5173
PORT=3001
```

2. backend/.gitignore
```
node_modules
dist
.env
.env.local
drizzle
*.log
```

---

## 🚀 NEXT SPRINT: Database Setup & Testing (Days 4-5)

### Ticket 6: Initialize Database
**Commands:**
```bash
cd backend

# Copy environment template and edit with your database URL
cp .env.example .env
# Edit .env with real DATABASE_URL from Neon

# Install dependencies
cd ..
pnpm install

# Build shared types
pnpm --filter shared build

# Generate migrations
cd backend
pnpm db:generate

# Push schema to database
pnpm db:push
```

---

### Ticket 7: Test Backend Locally
**Commands:**
```bash
cd backend
pnpm dev

# In another terminal, test endpoints:

# Register owner
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"password123","name":"Owner Name"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"password123"}'

# Create invite (use token from login response)
curl -X POST http://localhost:3001/api/invites/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"email":"ops@example.com","role":"ops"}'
```

---

## 🎨 NEXT SPRINT: Frontend (Days 6-10)

### Ticket 8: Initialize Frontend
**Prompt for Warp:**
```
Initialize Vite + React + TypeScript project in frontend/ directory:

Commands:
cd frontend
pnpm create vite@latest . --template react-ts

Install dependencies:
pnpm add wouter @tanstack/react-query zod
pnpm add -D tailwindcss postcss autoprefixer
pnpm add @roadmap/shared@workspace:*

Initialize Tailwind:
pnpm dlx tailwindcss init -p

Configure tailwind.config.js to scan src/**/*.{js,ts,jsx,tsx}

Create src/index.css with Tailwind directives:
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Ticket 9: Install shadcn/ui
**Commands:**
```bash
cd frontend

# Initialize shadcn
pnpm dlx shadcn-ui@latest init

# Add components we'll need
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add label
pnpm dlx shadcn-ui@latest add form
pnpm dlx shadcn-ui@latest add toast
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add tabs
pnpm dlx shadcn-ui@latest add badge
pnpm dlx shadcn-ui@latest add sheet
```

---

### Ticket 10: Create Auth Context
**Prompt for Warp:**
```
Create file: frontend/src/context/AuthContext.tsx

Implement React Context for authentication:
- Store user and token in state
- Provide login, register, logout functions
- Store token in localStorage
- Auto-load token on mount
- Provide loading state
- Export useAuth hook

Use types from '@roadmap/shared'
Make API calls to backend
```

---

### Ticket 11: Create API Client
**Prompt for Warp:**
```
Create file: frontend/src/lib/api.ts

Create API client with fetch:
- Base URL from import.meta.env.VITE_API_URL
- Helper functions:
  - login(email, password)
  - register(email, password, name)
  - createInvite(token, email, role)
  - acceptInvite(token, name, password)
  - submitIntake(token, role, answers)
  - getMyIntake(token)
  - getOwnerIntakes(token)

Include Authorization header with Bearer token
Handle errors properly
Return typed responses using @roadmap/shared types
```

---

### Ticket 12: Create Login/Register Page
**Prompt for Warp:**
```
Create file: frontend/src/pages/Auth.tsx

Build combined login/register page:
- Tab component to switch between login/register
- Login form: email, password
- Register form: email, password, name
- Use shadcn/ui Form components
- Use Zod for validation
- Call useAuth hooks
- Redirect to /owner/dashboard on success
- Show error toast on failure

Use shadcn Card, Tabs, Input, Button components
```

---

### Ticket 13: Create Owner Dashboard
**Prompt for Warp:**
```
Create file: frontend/src/pages/owner/Dashboard.tsx

Build owner dashboard with three invite cards:
- Operations Lead
- Sales Lead  
- Delivery Lead

Each card shows:
- Role name and description
- "Invite" button if not invited
- "Pending" badge if invited but not accepted
- "Completed" badge if accepted

Click "Invite" button opens dialog to enter email
After successful invite, show success toast

Use shadcn Card, Button, Badge, Dialog components
Fetch invite status from backend
```

---

### Ticket 14: Create Intake Forms
**Prompt for Warp:**
```
Create three intake form pages:

1. frontend/src/pages/intake/OpsIntake.tsx
2. frontend/src/pages/intake/SalesIntake.tsx  
3. frontend/src/pages/intake/DeliveryIntake.tsx

Each form includes role-specific questions from @roadmap/shared schemas:
- OpsIntakeAnswers
- SalesIntakeAnswers
- DeliveryIntakeAnswers

Use shadcn Form components
Use range sliders for 1-10 scale questions
Use select dropdowns for enum options
Use textarea for long-form text
Submit to backend API
Show success/error toasts
Redirect to confirmation page on success

Forms should be visually clean with good spacing
```

---

### Ticket 15: Create Router
**Prompt for Warp:**
```
Create file: frontend/src/App.tsx

Set up Wouter routing:
- / → Auth page
- /owner/dashboard → Owner Dashboard (protected)
- /owner/invite → Invite page (protected)
- /invite/:token → Accept invite page (public)
- /intake/ops → Ops intake form (protected)
- /intake/sales → Sales intake form (protected)
- /intake/delivery → Delivery intake form (protected)
- /owner/summary → Summary page (protected, scaffold)
- /owner/roadmap → Roadmap page (protected, scaffold)

Wrap app in AuthProvider
Add ProtectedRoute component that checks authentication
Show loading spinner while checking auth
```

---

## 📦 FINAL SPRINT: Polish & Deploy (Days 11-13)

### Ticket 16: Owner Summary Page (Scaffold)
**Prompt for Warp:**
```
Create file: frontend/src/pages/owner/Summary.tsx

Display consolidated intake data:
- Fetch all intakes from backend
- Show each role's responses in cards
- Display key metrics and bottlenecks
- Add "Export PDF" button (placeholder)
- Add "Generate Roadmap" button (placeholder)

Use shadcn Card, Button components
Show loading state while fetching
```

---

### Ticket 17: Roadmap Viewer (Scaffold)
**Prompt for Warp:**
```
Create file: frontend/src/pages/owner/Roadmap.tsx

Placeholder roadmap viewer:
- PDF viewer component (use react-pdf or iframe)
- Opportunities map section (placeholder visualization)
- Priority ranking section (placeholder table)
- Export buttons (placeholder)

Use shadcn Tabs to switch between sections
Add nice empty states
```

---

### Ticket 18: Deploy to Production
**Steps:**
1. Push code to GitHub
2. Create Neon database (production)
3. Run migrations on production DB
4. Deploy backend to Netlify Functions or Railway
5. Deploy frontend to Netlify
6. Configure environment variables
7. Test end-to-end flow

---

## 🎯 Success Criteria

### Backend Complete When:
- [x] Database schema created
- [ ] All API endpoints working
- [ ] Authentication flow works
- [ ] Invite emails sending
- [ ] Intake forms saving to DB
- [ ] Owner can view all intakes

### Frontend Complete When:
- [ ] Login/register works
- [ ] Owner dashboard functional
- [ ] Invite flow end-to-end works
- [ ] All three intake forms working
- [ ] Forms validate properly
- [ ] Error handling works
- [ ] UI looks professional

### Production Ready When:
- [ ] Both deployed
- [ ] Environment variables configured
- [ ] Email sending in production
- [ ] Database migrations run
- [ ] End-to-end tested
- [ ] Documentation updated

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test connection
cd backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Check Drizzle can connect
pnpm db:studio
```

### Type Errors in Frontend
```bash
# Rebuild shared types
cd shared
pnpm build

# Reinstall in frontend
cd ../frontend
pnpm install
```

### CORS Issues
Check backend `src/index.ts` has:
```typescript
app.use(cors());
```

And frontend API calls use correct URL.

---

Ready to continue? Pick the next ticket number and I'll generate the complete code for that ticket.
