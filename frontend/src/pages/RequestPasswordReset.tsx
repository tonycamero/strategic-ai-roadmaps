import { useState } from 'react';
import { useLocation } from 'wouter';

export default function RequestPasswordReset() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset link');
        return;
      }

      setSubmitted(true);
      // DEV ONLY: Store token for testing
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-100 mb-3">
                Check Your Email
              </h2>
              <p className="text-slate-400 mb-6">
                If an account exists with <span className="text-slate-200">{email}</span>,
                you'll receive a password reset link shortly.
              </p>

              {/* DEV ONLY - Remove in production */}
              {resetToken && (
                <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs text-amber-200 font-semibold mb-2">DEV ONLY - Reset Link:</p>
                  <button
                    onClick={() => setLocation(`/reset-password/${resetToken}`)}
                    className="w-full text-left px-3 py-2 bg-slate-800 text-slate-300 rounded text-xs font-mono break-all hover:bg-slate-700 transition-colors"
                  >
                    /reset-password/{resetToken}
                  </button>
                </div>
              )}

              <button
                onClick={() => setLocation('/login')}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8 card-glow-hover">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              Reset Your Password
            </h2>
            <p className="text-slate-400 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation('/login')}
                className="text-slate-500 hover:text-blue-500 text-sm transition-colors font-bold uppercase tracking-widest"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
