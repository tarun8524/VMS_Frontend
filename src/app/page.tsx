import Link from 'next/link';
import { Building2, UserCheck, Shield, Zap, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen topo-bg">
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-crimson-700 flex items-center justify-center shadow-red">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-gray-900 text-lg leading-none">VisitorVault</span>
            <span className="hidden sm:inline text-xs text-gray-400 tracking-widest uppercase ml-2">Management</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Visitor button — prominent top-right */}
          <Link
            href="/visitor/register"
            className="btn-primary shadow-red"
          >
            <UserCheck className="w-4 h-4" />
            I'm a Visitor
          </Link>
          <Link href="/login" className="btn-secondary">
            Employee Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crimson-50 border border-crimson-100 text-crimson-700 text-xs font-semibold tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-pulse" />
            Face Recognition Powered
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-5">
            Visitor Management,{' '}
            <span className="text-crimson-700">Reimagined.</span>
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl">
            Register visitors with face recognition, get instant employee notifications, and manage approvals — all in one professional platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/visitor/register" className="btn-primary text-base px-7 py-3 shadow-red">
              Register as Visitor
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/signup" className="btn-secondary text-base px-7 py-3">
              Employee Sign Up
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20">
          {[
            {
              icon: UserCheck,
              title: 'Face Recognition',
              desc: 'Powered by dlib — 128-dim embeddings stored in Qdrant for instant lookup.',
            },
            {
              icon: Zap,
              title: 'Instant Notifications',
              desc: 'Employees get real-time alerts when a visitor arrives. One-click approve or reject.',
            },
            {
              icon: Shield,
              title: 'Secure & Private',
              desc: 'MongoDB Atlas stores visitor records. JWT-secured employee access with bcrypt auth.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:shadow-card-lg transition-shadow group">
              <div className="w-10 h-10 rounded-xl bg-crimson-50 group-hover:bg-crimson-100 flex items-center justify-center mb-4 transition-colors">
                <Icon className="w-5 h-5 text-crimson-600" />
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
