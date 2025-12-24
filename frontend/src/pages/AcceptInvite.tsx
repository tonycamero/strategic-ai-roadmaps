import { useState } from 'react';
import { useRoute } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';

export default function AcceptInvite() {
  const [, params] = useRoute('/accept-invite/:token');
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.token) return;
    
    setError('');
    setLoading(true);

    try {
      const response = await api.acceptInvite({
        token: params.token,
        name,
        password,
      });
      login(response.token, response.user);
      
      // Redirect based on role (use window.location for full reload to ensure auth state is fresh)
      const role = response.user.role;
      if (role === 'ops' || role === 'sales' || role === 'delivery') {
        window.location.href = `/intake/${role}`;
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to accept invite');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Accept Invitation
            </h1>
            <p className="text-gray-600">
              You've been invited to join the Strategic AI Roadmap Portal
            </p>
          </div>

          <form onSubmit={handleAccept} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Choose Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
