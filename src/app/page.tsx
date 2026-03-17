'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { UserCheck, Eye, EyeOff, Loader2, X, UserPlus, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, visitorApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { EmployeeSearch } from '@/components/ui/EmployeeSearch';

// ─── Visitor floating modal ───────────────────────────────────────────────────
function VisitorModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'choose' | 'new' | 'returning' | 'done'>('choose');
  const [doneEmpName, setDoneEmpName] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          {/* <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" style={{ height: '40px', width: 'auto' }} />
          </div> */}
          <button onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Choose */}
          {step === 'choose' && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-1 text-center">Welcome!</h2>
              <p className="text-gray-500 text-center mb-6">Have you visited us before?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setStep('returning')}
                  className="p-5 rounded-xl border-2 border-transparent bg-gray-50 hover:border-crimson-200 hover:bg-crimson-50 transition-all group text-left">
                  <div className="w-10 h-10 rounded-xl bg-crimson-100 group-hover:bg-crimson-200 flex items-center justify-center mb-3 transition-colors">
                    <UserCheck className="w-5 h-5 text-crimson-600" />
                  </div>
                  <p className="font-semibold text-gray-900">Returning Visitor</p>
                  <p className="text-xs text-gray-500 mt-0.5">Recognize me by face</p>
                </button>
                <button onClick={() => setStep('new')}
                  className="p-5 rounded-xl border-2 border-transparent bg-gray-50 hover:border-blue-200 hover:bg-blue-50 transition-all group text-left">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-3 transition-colors">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-semibold text-gray-900">New Visitor</p>
                  <p className="text-xs text-gray-500 mt-0.5">Register my details</p>
                </button>
              </div>
            </div>
          )}

          {/* New visitor */}
          {step === 'new' && (
            <NewVisitorForm
              onBack={() => setStep('choose')}
              onDone={(empName) => { setDoneEmpName(empName); setStep('done'); }}
            />
          )}

          {/* Returning visitor */}
          {step === 'returning' && (
            <ReturningVisitorForm
              onBack={() => setStep('choose')}
              onDone={(empName) => { setDoneEmpName(empName); setStep('done'); }}
            />
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">You're Registered!</h2>
              <p className="text-gray-500 mb-1">Your visit request has been sent to{' '}
                <span className="font-semibold text-gray-700">{doneEmpName}</span>.
              </p>
              <p className="text-sm text-gray-400 mb-6">Please wait at reception while they review your request.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setStep('choose')} className="btn-secondary">Register Another</button>
                <button onClick={onClose} className="btn-primary">Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── New visitor form ─────────────────────────────────────────────────────────
function NewVisitorForm({ onBack, onDone }: { onBack: () => void; onDone: (empName: string) => void }) {
  const [photo, setPhoto]     = useState<Blob | null>(null);
  const [form, setForm]       = useState({ name: '', phone: '', email: '', purpose: '' });
  const [empId, setEmpId]     = useState('');
  const [empName, setEmpName] = useState('');
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!photo)      e.photo = 'Photo is required';
    if (!form.name)  e.name  = 'Required';
    if (!form.phone) e.phone = 'Required';
    if (!form.email) e.email = 'Required';
    if (!empId)      e.emp   = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name); fd.append('phone', form.phone);
      fd.append('email', form.email); fd.append('purpose', form.purpose);
      fd.append('employee_to_visit_id', empId);
      fd.append('photo', photo!, 'photo.jpg');
      await visitorApi.register(fd);
      onDone(empName);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed — check your photo');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <button type="button" onClick={onBack}
          className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
        </button>
        <h2 className="font-display font-bold text-gray-900 text-lg">New Visitor Registration</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Camera */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Step 1 — Photo <span className="text-crimson-500">*</span>
          </p>
          <CameraCapture
            onCapture={(blob) => { setPhoto(blob); setErrors((e) => ({ ...e, photo: '' })); }}
            onClear={() => setPhoto(null)}
          />
          {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Step 2 — Details</p>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
            <input className={`input text-sm py-2 ${errors.name ? 'border-red-400' : ''}`}
              placeholder="Ravi Shankar" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone *</label>
            <input className={`input text-sm py-2 ${errors.phone ? 'border-red-400' : ''}`}
              placeholder="+91 98765 43210" type="tel" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email *</label>
            <input className={`input text-sm py-2 ${errors.email ? 'border-red-400' : ''}`}
              placeholder="you@email.com" type="email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Employee to Visit *</label>
            <EmployeeSearch value={empId}
              onChange={(id, name) => { setEmpId(id); setEmpName(name); setErrors((e) => ({ ...e, emp: '' })); }}
              error={errors.emp} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Purpose</label>
            <input className="input text-sm py-2" placeholder="Meeting, Interview…"
              value={form.purpose} onChange={set('purpose')} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-5">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Registering…' : 'Submit Visit Request'}
      </button>
    </form>
  );
}

// ─── Returning visitor form ───────────────────────────────────────────────────
function ReturningVisitorForm({ onBack, onDone }: { onBack: () => void; onDone: (empName: string) => void }) {
  const [photo, setPhoto]     = useState<Blob | null>(null);
  const [empId, setEmpId]     = useState('');
  const [empName, setEmpName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [matched, setMatched] = useState<any | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const recognize = async () => {
    if (!photo) { setErrors((e) => ({ ...e, photo: 'Please capture or upload a photo first' })); return; }
    setLoading(true); setMatched(null);
    try {
      const fd = new FormData();
      fd.append('photo', photo, 'query.jpg'); fd.append('limit', '1');
      const { data } = await visitorApi.recognize(fd);
      if (data.matched?.length > 0) {
        setMatched(data.matched[0]);
        toast.success(`Welcome back, ${data.matched[0].name}!`);
      } else {
        toast.error('Face not recognized. Are you a new visitor?');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Recognition failed');
    } finally { setLoading(false); }
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!matched) errs.photo = 'Please recognize your face first';
    if (!empId)   errs.emp   = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', matched.name); fd.append('phone', matched.phone);
      fd.append('email', matched.email); fd.append('purpose', purpose);
      fd.append('employee_to_visit_id', empId);
      fd.append('photo', photo!, 'photo.jpg');
      await visitorApi.register(fd);
      onDone(empName);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Request failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack}
          className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
        </button>
        <h2 className="font-display font-bold text-gray-900 text-lg">Welcome Back!</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Step 1 — Take / Upload Photo
          </p>
          <CameraCapture
            onCapture={(blob) => { setPhoto(blob); setMatched(null); setErrors((e) => ({ ...e, photo: '' })); }}
            onClear={() => { setPhoto(null); setMatched(null); }}
          />
          {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
          <button onClick={recognize} disabled={!photo || loading}
            className="btn-primary w-full justify-center mt-3 disabled:opacity-50">
            {loading && !matched ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            {loading && !matched ? 'Recognizing…' : 'Recognize Me'}
          </button>
          {matched && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              {matched.thumbnail
                ? <img src={`data:image/jpeg;base64,${matched.thumbnail}`} className="w-10 h-10 rounded-full object-cover" alt="" />
                : <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">{matched.name.charAt(0)}</div>
              }
              <div>
                <p className="font-semibold text-emerald-800 text-sm">{matched.name}</p>
                <p className="text-xs text-emerald-600">{matched.phone}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Step 2 — Visit Details</p>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Employee to Visit *</label>
            <EmployeeSearch value={empId}
              onChange={(id, name) => { setEmpId(id); setEmpName(name); setErrors((e) => ({ ...e, emp: '' })); }}
              error={errors.emp} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Purpose</label>
            <input className="input text-sm py-2" placeholder="Meeting, Follow-up…"
              value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          {!matched && <p className="text-xs text-gray-400">Recognize your face in Step 1 first</p>}
        </div>
      </div>

      <button onClick={submit} disabled={loading || !matched}
        className="btn-primary w-full justify-center mt-5 disabled:opacity-50">
        {loading && matched ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading && matched ? 'Submitting…' : 'Submit Visit Request'}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [card, setCard]           = useState<'signin' | 'signup'>('signin');
  const [showVisitor, setShowVisitor] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Visitor floating modal */}
      {showVisitor && <VisitorModal onClose={() => setShowVisitor(false)} />}

      {/* Top nav — only visitor button */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-end">
        <button onClick={() => setShowVisitor(true)} className="btn-primary shadow-red text-sm">
          <UserCheck className="w-4 h-4" />
          I'm a Visitor
        </button>
      </header>

      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* Left — hero image */}
        <div className="relative lg:w-3/5 flex-shrink-0 min-h-[45vh] lg:min-h-screen overflow-hidden bg-white">
          <div className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: "url('/vms-hero.png')", opacity: 0.15 }} />
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-r from-transparent to-gray-50 hidden lg:block" />
          <div className="relative z-10 flex items-center justify-center lg:justify-start h-full pt-24 lg:pt-0 pb-10 lg:pb-0 px-10 lg:px-16">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crimson-50 border border-crimson-100 text-crimson-700 text-xs font-semibold tracking-wide mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-pulse" />
                Face Recognition Powered
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Visitor Management,{' '}
                <span className="text-crimson-700">Reimagined.</span>
              </h1>
              <p className="text-gray-500 mt-4 text-base leading-relaxed">
                Register visitors with face recognition, get instant employee notifications, and manage approvals — all in one professional platform.
              </p>
            </div>
          </div>
        </div>

        {/* Right — employee card */}
        <div className="lg:w-2/5 flex items-center justify-center px-6 py-16 lg:py-0 bg-gray-50">
          <div className="w-full max-w-sm animate-slide-up">
            <div className="card shadow-card-lg">

              {/* Logo */}
              <div className="flex items-center justify-center mb-5">
                <img src="/logo.png" alt="Logo" style={{ height: '70px', width: '260px' }} />
              </div>

              {/* Toggle */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
                <button onClick={() => setCard('signin')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    card === 'signin' ? 'bg-white text-crimson-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>Sign In</button>
                <button onClick={() => setCard('signup')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    card === 'signup' ? 'bg-white text-crimson-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>Sign Up</button>
              </div>

              {card === 'signin' ? <SignInForm /> : <SignUpForm onDone={() => setCard('signin')} />}
            </div>
            

            <p className="text-center mt-4 text-sm text-gray-400">
              Visiting someone?{' '}
              <button onClick={() => setShowVisitor(true)} className="text-crimson-600 font-medium hover:text-crimson-700">
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sign In ───────────────────────────────────────────────────────────────────
function SignInForm() {
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
      localStorage.setItem('vms_token', data.access_token);
      localStorage.setItem('vms_employee', JSON.stringify(data.employee));
      login(data.access_token, data.employee);
      toast.success(`Welcome back, ${data.employee.name}!`);
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email</label>
        <input type="email" className="input text-sm py-2" placeholder="you@company.com"
          value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Password</label>
        <div className="relative">
          <input type={showPw ? 'text' : 'password'} className="input text-sm py-2 pr-10"
            placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary justify-center py-2.5 mt-1">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

// ── Sign Up ───────────────────────────────────────────────────────────────────
function SignUpForm({ onDone }: { onDone: () => void }) {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !employeeId || !password) { toast.error('Please fill all required fields'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6)  { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authApi.register({ name, email, employee_id: employeeId.toUpperCase(), department, password });
      toast.success('Account created! Please sign in.');
      onDone();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
          <input type="text" className="input text-sm py-2" placeholder="Nedhunuri Tarun"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Email *</label>
          <input type="email" className="input text-sm py-2" placeholder="tarun@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Employee ID *</label>
          <input type="text" className="input text-sm py-2 uppercase" placeholder="R098"
            value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Department</label>
          <input type="text" className="input text-sm py-2" placeholder="Engineering"
            value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Password *</label>
          <input type="password" className="input text-sm py-2" placeholder="Min. 6 chars"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Confirm *</label>
          <input type="password" className="input text-sm py-2" placeholder="Repeat"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary justify-center py-2.5 mt-1">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Creating…' : 'Create Account'}
      </button>
    </form>
  );
}