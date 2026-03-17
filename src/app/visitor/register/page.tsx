'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { visitorApi } from '@/lib/api';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { EmployeeSearch } from '@/components/ui/EmployeeSearch';

export default function VisitorRegisterPage() {
  const [photo, setPhoto]   = useState<Blob | null>(null);
  const [form, setForm]     = useState({ name: '', phone: '', email: '', purpose: '' });
  const [empId, setEmpId]   = useState('');
  const [empName, setEmpName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);
  const router = useRouter();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!photo)        e.photo   = 'Photo is required';
    if (!form.name)    e.name    = 'Full name is required';
    if (!form.phone)   e.phone   = 'Phone number is required';
    if (!form.email)   e.email   = 'Email is required';
    if (!empId)        e.emp     = 'Please select an employee to visit';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name',  form.name);
      fd.append('phone', form.phone);
      fd.append('email', form.email);
      fd.append('purpose', form.purpose);
      fd.append('employee_to_visit_id', empId);
      fd.append('photo', photo!, 'photo.jpg');
      await visitorApi.register(fd);
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed — check your photo');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen topo-bg flex items-center justify-center px-4">
        <div className="card shadow-card-lg max-w-md w-full text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">You're Registered!</h2>
          <p className="text-gray-500 mb-2">
            Your visit request has been sent to <span className="font-semibold text-gray-700">{empName}</span>.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Please wait at reception while they review your request.
          </p>
          <button onClick={() => { setDone(false); setForm({ name:'',phone:'',email:'',purpose:'' }); setEmpId(''); setEmpName(''); setPhoto(null); }}
            className="btn-primary w-full justify-center">
            Register Another Visitor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen topo-bg pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-crimson-700 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">VisitorVault</span>
          </div>
          <Link href="/" className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-1.5">Visitor Registration</h1>
          <p className="text-gray-500">Take a photo and fill in your details to register your visit.</p>
        </div>

        <form onSubmit={submit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left — camera */}
            <div className="card shadow-card">
              <h2 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-crimson-100 text-crimson-700 text-xs font-bold flex items-center justify-center">1</span>
                Take Your Photo
              </h2>
              <CameraCapture
                onCapture={(blob) => { setPhoto(blob); setErrors((e) => ({ ...e, photo: '' })); }}
                onClear={() => setPhoto(null)}
              />
              {errors.photo && <p className="text-xs text-red-500 mt-2">{errors.photo}</p>}
            </div>

            {/* Right — form */}
            <div className="card shadow-card">
              <h2 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-crimson-100 text-crimson-700 text-xs font-bold flex items-center justify-center">2</span>
                Your Details
              </h2>

              <div className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Full Name <span className="text-crimson-500">*</span>
                  </label>
                  <input className={`input ${errors.name ? 'border-red-400 focus:ring-red-300' : ''}`}
                    placeholder="Ravi Shankar" value={form.name} onChange={set('name')} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Phone Number <span className="text-crimson-500">*</span>
                  </label>
                  <input className={`input ${errors.phone ? 'border-red-400' : ''}`}
                    placeholder="+91 98765 43210" type="tel" value={form.phone} onChange={set('phone')} />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Email Address <span className="text-crimson-500">*</span>
                  </label>
                  <input className={`input ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="you@email.com" type="email" value={form.email} onChange={set('email')} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Employee to visit */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Employee to Visit <span className="text-crimson-500">*</span>
                  </label>
                  <EmployeeSearch
                    value={empId}
                    onChange={(id, name) => {
                      setEmpId(id);
                      setEmpName(name);
                      setErrors((e) => ({ ...e, emp: '' }));
                    }}
                    error={errors.emp}
                  />
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Purpose of Visit
                  </label>
                  <input className="input" placeholder="Meeting, Interview, Delivery…"
                    value={form.purpose} onChange={set('purpose')} />
                </div>

                <button type="submit" disabled={loading} className="btn-primary justify-center py-3 mt-1">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Registering…' : 'Submit Visit Request'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
