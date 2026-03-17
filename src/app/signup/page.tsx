'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';

export default function SignupPage() {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !employeeId || !password) {
      toast.error('Please fill all required fields'); return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match'); return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setLoading(true);
    try {
      await authApi.register({
        name,
        email,
        employee_id: employeeId.toUpperCase(),
        department,
        password,
      });
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen topo-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-crimson-700 flex items-center justify-center shadow-red">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-gray-900">VisitorVault</span>
        </div>

        <div className="card shadow-card-lg">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Create Employee Account</h1>
          <p className="text-sm text-gray-500 mb-6">Register to manage your visitor approvals</p>

          <form onSubmit={submit} className="flex flex-col gap-4">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Full Name <span className="text-crimson-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="Nedhunuri Tarun"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Email Address <span className="text-crimson-500">*</span>
              </label>
              <input
                type="email"
                className="input"
                placeholder="tarun@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Employee ID + Department */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Employee ID <span className="text-crimson-500">*</span>
                </label>
                <input
                  type="text"
                  className="input uppercase"
                  placeholder="R098"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Password <span className="text-crimson-500">*</span>
              </label>
              <input
                type="password"
                className="input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Confirm Password <span className="text-crimson-500">*</span>
              </label>
              <input
                type="password"
                className="input"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary justify-center py-3 mt-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-crimson-700 font-semibold hover:text-crimson-800">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}