'use client';
import { useEffect, useState } from 'react';
import { Bell, Check, X, RefreshCw, Clock, LogIn, LogOut } from 'lucide-react';
import { visitApi } from '@/lib/api';
import { Visit, VisitStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

type ActionBtn = { label: string; status: VisitStatus; icon: React.ElementType; cls: string };

const ACTIONS: Record<string, ActionBtn[]> = {
  pending: [
    { label: 'Approve',     status: 'approved',    icon: Check,   cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { label: 'Reject',      status: 'rejected',    icon: X,       cls: 'bg-red-500 hover:bg-red-600 text-white' },
  ],
  approved: [
    { label: 'Check In',    status: 'checked_in',  icon: LogIn,   cls: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Reject',      status: 'rejected',    icon: X,       cls: 'bg-red-500 hover:bg-red-600 text-white' },
  ],
  checked_in: [
    { label: 'Check Out',   status: 'checked_out', icon: LogOut,  cls: 'bg-gray-700 hover:bg-gray-800 text-white' },
  ],
};

export default function NotificationsPage() {
  const [visits, setVisits]   = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await visitApi.myVisits();
      // Show active visits (not finished)
      setVisits(data.filter((v: Visit) => v.status !== 'checked_out'));
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (visitId: string, status: VisitStatus) => {
    setUpdating(visitId + status);
    try {
      const { data } = await visitApi.updateStatus(visitId, status);
      setVisits((prev) => prev.map((v) => v.visit_id === visitId ? { ...v, status: data.status } : v)
        .filter((v) => v.status !== 'checked_out'));
      toast.success(`Visit ${status.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const pending = visits.filter((v) => v.status === 'pending');
  const active  = visits.filter((v) => v.status !== 'pending');

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 flex items-center gap-3">
            Visitor Approvals
            {pending.length > 0 && (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-crimson-600 text-white text-xs font-bold animate-pulse-dot">
                {pending.length}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Review and manage incoming visitor requests</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No pending or active visits right now</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending section */}
          {pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Awaiting Your Approval ({pending.length})
                </h2>
              </div>
              <div className="grid gap-3">
                {pending.map((v) => (
                  <VisitCard key={v.visit_id} visit={v} onAction={updateStatus} updating={updating} />
                ))}
              </div>
            </section>
          )}

          {/* Active visits */}
          {active.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <LogIn className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Active Visits ({active.length})
                </h2>
              </div>
              <div className="grid gap-3">
                {active.map((v) => (
                  <VisitCard key={v.visit_id} visit={v} onAction={updateStatus} updating={updating} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function VisitCard({ visit: v, onAction, updating }: {
  visit: Visit;
  onAction: (id: string, s: VisitStatus) => void;
  updating: string | null;
}) {
  const actions = ACTIONS[v.status] || [];

  return (
    <div className={`card shadow-card flex flex-col sm:flex-row gap-4 animate-slide-up ${
      v.status === 'pending' ? 'border-l-4 border-l-amber-400' :
      v.status === 'approved' ? 'border-l-4 border-l-emerald-400' :
      'border-l-4 border-l-blue-400'
    }`}>
      {/* Photo */}
      <div className="flex-shrink-0">
        {v.visitor_thumbnail ? (
          <img
            src={`data:image/jpeg;base64,${v.visitor_thumbnail}`}
            alt={v.visitor_name}
            className="w-20 h-20 rounded-xl object-cover border border-gray-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-crimson-100 flex items-center justify-center text-crimson-600 text-2xl font-bold">
            {v.visitor_name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="font-display font-bold text-gray-900 text-lg leading-tight">{v.visitor_name}</h3>
          <StatusBadge status={v.status} />
        </div>
        <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-500">
          <span>📞 {v.visitor_phone}</span>
          <span>✉ {v.visitor_email}</span>
          {v.purpose && <span className="sm:col-span-2">🏷 {v.purpose}</span>}
          <span className="text-xs text-gray-400 sm:col-span-2">
            Requested {new Date(v.created_at).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="flex sm:flex-col gap-2 flex-shrink-0 self-center sm:self-start">
          {actions.map(({ label, status, icon: Icon, cls }) => {
            const key = v.visit_id + status;
            return (
              <button
                key={status}
                onClick={() => onAction(v.visit_id, status)}
                disabled={updating === key}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${cls}`}
              >
                {updating === key
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Icon className="w-3.5 h-3.5" />
                }
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
