import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';

function resolvePostAuthRedirect(role: string, nextParam?: string | null): string {
  // 1) If api.ts sent us here with ?next=..., honor it (but only if it’s internal)
  if (nextParam) {
    const decoded = decodeURIComponent(nextParam);
    if (decoded.startsWith('/')) return decoded;
  }

  // 2) Otherwise role-based default
  if (role === 'superadmin') return '/superadmin/firms';
  if (role === 'ops' || role === 'sales' || role === 'delivery') return `/intake/${role}`;
  if (role === 'exec_sponsor') return '/intake/exec_sponsor';

  // 3) Default
  return '/dashboard';
}

// near top of Auth.tsx (above component)
function getNextParam(): string | null {
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next) return null;
  // must be internal path
  if (!next.startsWith('/')) return null;
  // avoid protocol-relative + weirdness
  if (next.startsWith('//')) return null;
  return next;
}

function isNextAllowedForRole(role: string, next: string): boolean {
  if (role === 'superadmin') return next.startsWith('/superadmin');
  if (role === 'exec_sponsor') return next.startsWith('/intake/exec_sponsor') || next.startsWith('/dashboard');
  if (role === 'ops' || role === 'sales' || role === 'delivery') return next.startsWith(`/intake/${role}`) || next.startsWith('/dashboard');
  // default user roles
  return next.startsWith('/dashboard') || next.startsWith('/intake');
}


function getSafeNextFromQuery(): string | null {
  const sp = new URLSearchParams(window.location.search);
  const nextParam = sp.get('next');
  if (!nextParam) return null;

  try {
    const decoded = decodeURIComponent(nextParam);
    // allow only internal paths
    if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded;
    return null;
  } catch {
    return null;
  }
}

function getReasonFromQuery(): string | null {
  const sp = new URLSearchParams(window.location.search);
  return sp.get('reason');
}

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const safeNext = getSafeNextFromQuery();
  const reason = getReasonFromQuery();

  // If user was redirected here due to expiry, show a clean banner.
  useEffect(() => {
    if (reason === 'expired') {
      setError('Session expired — please log in again.');
    }
  }, [reason]);

  // Redirect if already authenticated
    useEffect(() => {
      if (!isAuthenticated || !user) return;
 
      const next = new URLSearchParams(window.location.search).get('next');
      setLocation(resolvePostAuthRedirect(user.role, next));
    }, [isAuthenticated, user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login({ email, password });
      login(response.token, response.user);

      // Small delay to ensure auth state is set before redirect
      const next = new URLSearchParams(window.location.search).get('next');
      
      setTimeout(() => {
        setLocation(resolvePostAuthRedirect(response.user.role, next));
      }, 100); 

    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans">
      <div className="max-w-md w-full">
        <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8 card-glow-hover">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              <span className="text-blue-500">Strategic</span> AI Roadmap Portal
            </h1>
            <p className="text-slate-400">Welcome back</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setLocation('/request-reset')}
                  className="text-sm text-blue-500 hover:text-blue-400 transition-colors font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setLocation('/signup')}
              className="text-blue-500 hover:text-blue-400 text-sm font-bold transition-colors uppercase tracking-wide"
            >
              Don&apos;t have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}