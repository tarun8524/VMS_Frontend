'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      // Write directly to localStorage first, then call login() to sync context
      localStorage.setItem('vms_token', data.access_token);
      localStorage.setItem('vms_employee', JSON.stringify(data.employee));
      login(data.access_token, data.employee);
      toast.success(`Welcome back, ${data.employee.name}!`);
      // Hard redirect — ensures dashboard layout reads fresh localStorage
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen topo-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-crimson-700 flex items-center justify-center shadow-red">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-gray-900">VisitorVault</span>
        </div>

        <div className="card shadow-card-lg">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Employee Sign In</h1>
          <p className="text-sm text-gray-500 mb-6">Access your visitor management dashboard</p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary justify-center py-3 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-crimson-700 font-semibold hover:text-crimson-800">
              Sign up
            </Link>
          </div>
        </div>

        <p className="text-center mt-5 text-sm text-gray-400">
          Visiting someone?{' '}
          <Link href="/visitor/register" className="text-crimson-600 font-medium hover:text-crimson-700">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}