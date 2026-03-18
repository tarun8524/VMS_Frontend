'use client';
import { useEffect, useState } from 'react';
import { Users, Clock, CheckCircle, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { visitApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DashboardStats, Visit } from '@/types';

export default function DashboardPage() {
  const { employee, loading: authLoading } = useAuth();
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !employee) return;
    Promise.all([
      visitApi.stats(),
      visitApi.myVisits(undefined),
    ]).then(([s, v]) => {
      setStats(s.data);
      setVisits(v.data.slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [authLoading, employee]);

  const statCards = [
    { label: 'Total Visits',   value: stats?.total    ?? '—', icon: Users,       color: 'blue'    },
    { label: 'Pending',        value: stats?.pending  ?? '—', icon: Clock,       color: 'amber'   },
    { label: 'Approved',       value: stats?.approved ?? '—', icon: CheckCircle, color: 'emerald' },
    { label: "Today's Visits", value: stats?.today    ?? '—', icon: Calendar,    color: 'crimson' },
  ];

  const colorMap: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-600',
    amber:   'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    crimson: 'bg-crimson-50 text-crimson-600',
  };

  return (
    <div className="animate-fade-in">

      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {employee?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Here's what's happening with your visits today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card animate-slide-up">
            <div className="flex items-start justify-between">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <div className="mt-1">
              <p className="text-2xl font-bold text-gray-900">
                {loading
                  ? <span className="inline-block w-7 h-6 bg-gray-100 rounded animate-pulse" />
                  : value}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent visits + quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent visits */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Visits</h2>
            <Link
              href="/dashboard/visits"
              className="text-xs text-crimson-600 font-semibold hover:text-crimson-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No visits yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {visits.map((v) => (
                <div
                  key={v.visit_id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {v.visitor_thumbnail ? (
                    <img
                      src={`data:image/jpeg;base64,${v.visitor_thumbnail}`}
                      alt={v.visitor_name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-crimson-100 flex items-center justify-center flex-shrink-0 text-crimson-600 font-bold text-xs">
                      {v.visitor_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.visitor_name}</p>
                    <p className="text-xs text-gray-400 truncate">{v.purpose || 'No purpose stated'}</p>
                  </div>
                  <StatusBadge status={v.status} />
                  <p className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                    {fmtDate(v.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard/notifications"
              className="flex items-center gap-3 p-3 rounded-lg border border-crimson-100 bg-crimson-50 hover:bg-crimson-100 transition-colors group"
            >
              <Clock className="w-4 h-4 text-crimson-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-crimson-800">Pending Approvals</p>
                <p className="text-xs text-crimson-500">Review & approve visits</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-crimson-400 ml-auto flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/search"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700">Search Visitor</p>
                <p className="text-xs text-gray-400">Find by face or name</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/visits"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700">Visit History</p>
                <p className="text-xs text-gray-400">All visits & records</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto flex-shrink-0" />
            </Link>
          </div>

          {/* Employee info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Profile</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Employee ID</span>
                <span className="font-mono font-semibold text-gray-900 text-xs">{employee?.employee_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Department</span>
                <span className="font-semibold text-gray-900 text-xs">{employee?.department || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
