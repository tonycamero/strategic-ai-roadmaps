# Frontend Build Guide - Strategic AI Roadmap Portal

This guide will help you build the complete React frontend in ~2-3 hours.

---

## 🚀 Quick Setup (5 minutes)

```bash
cd /home/tonycamero/code/Strategic_AI_Roadmaps/frontend

# Initialize Vite React TypeScript project
pnpm create vite@latest . --template react-ts

# Install additional dependencies
pnpm add wouter @tanstack/react-query zod
pnpm add -D tailwindcss postcss autoprefixer

# Add workspace dependency
pnpm add @roadmap/shared@workspace:*

# Initialize Tailwind
pnpm dlx tailwindcss init -p
```

---

## 📋 Project Structure to Create

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router setup
│   ├── index.css                   # Tailwind imports
│   ├── vite-env.d.ts              # Vite types
│   ├── lib/
│   │   └── api.ts                 # API client
│   ├── context/
│   │   └── AuthContext.tsx        # Auth state
│   ├── hooks/
│   │   └── useAuth.ts             # Auth hook
│   ├── components/
│   │   ├── ui/                    # shadcn components (optional)
│   │   ├── Layout.tsx             # Main layout
│   │   └── ProtectedRoute.tsx    # Route guard
│   └── pages/
│       ├── Auth.tsx               # Login/Register
│       ├── owner/
│       │   ├── Dashboard.tsx      # Owner dashboard
│       │   ├── Summary.tsx        # Intake summary
│       │   └── Roadmap.tsx        # Roadmap viewer
│       ├── intake/
│       │   ├── OpsIntake.tsx      # Ops form
│       │   ├── SalesIntake.tsx    # Sales form
│       │   └── DeliveryIntake.tsx # Delivery form
│       └── AcceptInvite.tsx       # Invite acceptance
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── .env.example
```

---

## Step 1: Configure Vite

**File: `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

---

## Step 2: Configure Tailwind

**File: `frontend/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**File: `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## Step 3: Environment Variables

**File: `frontend/.env.example`**

```bash
VITE_API_URL=http://localhost:3001
```

**File: `frontend/.env`**

```bash
VITE_API_URL=http://localhost:3001
```

---

## Step 4: API Client

**File: `frontend/src/lib/api.ts`**

```typescript
import type { 
  LoginRequest, 
  RegisterRequest, 
  CreateInviteRequest,
  AcceptInviteRequest,
  SubmitIntakeRequest,
  UserRole 
} from '@roadmap/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (data: LoginRequest) =>
      fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    register: (data: RegisterRequest) =>
      fetchAPI('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  invites: {
    create: (token: string, data: CreateInviteRequest) =>
      fetchAPI('/api/invites/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      }),

    accept: (data: AcceptInviteRequest) =>
      fetchAPI('/api/invites/accept', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: (token: string) =>
      fetchAPI('/api/invites/list', {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  intake: {
    submit: (token: string, data: SubmitIntakeRequest) =>
      fetchAPI('/api/intake/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      }),

    getMine: (token: string) =>
      fetchAPI('/api/intake/mine', {
        headers: { Authorization: `Bearer ${token}` },
      }),

    getOwnerIntakes: (token: string) =>
      fetchAPI('/api/intake/owner', {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
};
```

---

## Step 5: Auth Context

**File: `frontend/src/context/AuthContext.tsx`**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import type { User, LoginRequest, RegisterRequest } from '@roadmap/shared';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await api.auth.login(data);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const register = async (data: RegisterRequest) => {
    const response = await api.auth.register(data);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Step 6: Protected Route Component

**File: `frontend/src/components/ProtectedRoute.tsx`**

```typescript
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'wouter';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
```

---

## Step 7: Simple Auth Page

**File: `frontend/src/pages/Auth.tsx`**

```typescript
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
      setLocation('/owner/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">
            {isLogin ? 'Sign In' : 'Register'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            minLength={8}
          />
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-sm text-blue-600 hover:underline"
        >
          {isLogin ? 'Need an account? Register' : 'Have an account? Sign In'}
        </button>
      </div>
    </div>
  );
}
```

---

## Step 8: Owner Dashboard

**File: `frontend/src/pages/owner/Dashboard.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { UserRole } from '@roadmap/shared';

export function OwnerDashboard() {
  const { token, user } = useAuth();
  const [invites, setInvites] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('ops');

  useEffect(() => {
    if (token) {
      api.invites.list(token).then(setInvites).catch(console.error);
    }
  }, [token]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await api.invites.create(token, { email: inviteEmail, role: inviteRole });
      alert('Invite sent!');
      setInviteEmail('');
      setShowInviteModal(false);
      const updated = await api.invites.list(token);
      setInvites(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invite');
    }
  };

  const roleCards = [
    { role: 'ops' as UserRole, title: 'Operations Lead', description: 'Manage daily operations' },
    { role: 'sales' as UserRole, title: 'Sales Lead', description: 'Manage sales pipeline' },
    { role: 'delivery' as UserRole, title: 'Delivery Lead', description: 'Manage service delivery' },
  ];

  const getInviteStatus = (role: UserRole) => {
    const invite = invites.find(i => i.role === role);
    if (!invite) return 'not_invited';
    return invite.accepted ? 'accepted' : 'pending';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Owner Dashboard</h1>
        <p className="mb-8">Welcome, {user?.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleCards.map(card => {
            const status = getInviteStatus(card.role);
            return (
              <div key={card.role} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-gray-600 mb-4">{card.description}</p>
                {status === 'not_invited' && (
                  <button
                    onClick={() => {
                      setInviteRole(card.role);
                      setShowInviteModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Send Invite
                  </button>
                )}
                {status === 'pending' && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded">Pending</span>
                )}
                {status === 'accepted' && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded">Completed</span>
                )}
              </div>
            );
          })}
        </div>

        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Send Invite</h2>
              <form onSubmit={handleInvite}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded mb-4"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Step 9: App Router

**File: `frontend/src/App.tsx`**

```typescript
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Auth } from './pages/Auth';
import { OwnerDashboard } from './pages/owner/Dashboard';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/" component={Auth} />
          <Route path="/owner/dashboard">
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          </Route>
          <Route>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-xl">404 - Page Not Found</div>
            </div>
          </Route>
        </Switch>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## Step 10: Main Entry

**File: `frontend/src/main.tsx`**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**File: `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Strategic AI Roadmap Portal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 🚀 Run the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Visit http://localhost:5173

---

## ✅ What You Have Now

- ✅ Login/Register page
- ✅ Owner Dashboard with invite cards
- ✅ Protected routes
- ✅ API client with type safety
- ✅ Auth context
- ✅ Tailwind styling

---

## 🎯 Next: Add Intake Forms

The intake forms follow the same pattern - create pages in `src/pages/intake/` that use the shared Zod schemas for validation.

See `SPRINT_TICKETS.md` Ticket 14 for full intake form implementation!

---

**Ready to test?** Start both servers and try the full flow!
