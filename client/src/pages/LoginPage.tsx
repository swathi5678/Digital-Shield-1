import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setToken } = useSecurityStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setToken(token);
      setUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="w-12 h-12 text-shield-accent" />
          </div>
          <h1 className="text-4xl font-bold text-white">Digital Shield</h1>
          <p className="text-gray-400">Cybersecurity Intelligence Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-gray-100 focus:outline-none focus:border-shield-accent transition-colors"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-gray-100 focus:outline-none focus:border-shield-accent transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-shield-accent hover:bg-purple-500 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="border-t border-slate-700 pt-6 space-y-3">
          <p className="text-sm text-gray-400 font-semibold">Demo Credentials:</p>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-900 p-2 rounded">
              <p className="text-gray-300"><strong>ciso@demo.com</strong> — Full access</p>
            </div>
            <div className="bg-slate-900 p-2 rounded">
              <p className="text-gray-300"><strong>pm@demo.com</strong> — Project manager</p>
            </div>
            <div className="bg-slate-900 p-2 rounded">
              <p className="text-gray-300"><strong>analyst@demo.com</strong> — Security analyst</p>
            </div>
            <div className="bg-slate-900 p-2 rounded">
              <p className="text-gray-300"><strong>auditor@demo.com</strong> — Read-only access</p>
            </div>
            <div className="bg-slate-900 p-2 rounded">
              <p className="text-gray-300"><strong>Password:</strong> Shield@2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
