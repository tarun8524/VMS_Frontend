'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Bell, Check, X, RefreshCw, LogIn, LogOut,
  MapPin, KeyRound, ExternalLink, Trash2, UserCheck, Calendar,
} from 'lucide-react';
import { visitApi, locationApi } from '@/lib/api';
import { Visit, VisitStatus, Location } from '@/types';
import toast from 'react-hot-toast';

/* ── localStorage helpers for dismissed visit IDs ──────────────────────── */
const DISMISSED_KEY = 'vms_dismissed_visits';

function getDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw);
    if (date !== new Date().toDateString()) {
      localStorage.removeItem(DISMISSED_KEY);
      return new Set();
    }
    return new Set<string>(ids);
  } catch { return new Set(); }
}

function saveDismissedIds(ids: Set<string>) {
  try {
    localStorage.setItem(
      DISMISSED_KEY,
      JSON.stringify({ date: new Date().toDateString(), ids: Array.from(ids) })
    );
  } catch {}
}

function addDismissedId(id: string) {
  const ids = getDismissedIds(); ids.add(id); saveDismissedIds(ids);
}

function clearDismissedIds() { localStorage.removeItem(DISMISSED_KEY); }

/* ── Status dot ─────────────────────────────────────────────────────────── */
function StatusDot({ status }: { status: VisitStatus }) {
  const map: Record<string, { color: string; label: string }> = {
    pending:     { color: 'bg-amber-400',   label: 'Pending'     },
    approved:    { color: 'bg-emerald-400', label: 'Approved'    },
    rejected:    { color: 'bg-red-400',     label: 'Rejected'    },
    checked_in:  { color: 'bg-blue-400',    label: 'Checked In'  },
    checked_out: { color: 'bg-gray-400',    label: 'Checked Out' },
  };
  const { color, label } = map[status] ?? { color: 'bg-gray-300', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

/* ── Approve modal ──────────────────────────────────────────────────────── */
function ApproveModal({
  visit, locations, onConfirm, onClose,
}: {
  visit: Visit;
  locations: Location[];
  onConfirm: (locationId: string, requireOtp: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [locationId, setLocationId] = useState('');
  const [requireOtp, setRequireOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectedLoc = locations.find(l => l.location_id === locationId);

  const handleSubmit = async () => {
    if (!locationId) { toast.error('Please select a meeting location'); return; }
    setSubmitting(true);
    try { await onConfirm(locationId, requireOtp); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" style={{ paddingBottom: 72 }}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-slide-up overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 130px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm lg:text-base">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            Approve Visit
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Visitor chip */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {visit.visitor_thumbnail
              ? <img src={`data:image/jpeg;base64,${visit.visitor_thumbnail}`} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
              : <div className="w-10 h-10 rounded-xl bg-crimson-100 flex items-center justify-center text-crimson-600 font-bold flex-shrink-0">{visit.visitor_name.charAt(0)}</div>
            }
            <div>
              <p className="font-semibold text-gray-900 text-sm">{visit.visitor_name}</p>
              <p className="text-xs text-gray-400">{visit.visitor_email}</p>
            </div>
          </div>

          {/* Location picker */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-crimson-500" />Meeting Location <span className="text-crimson-500">*</span>
            </p>
            <div className="space-y-2">
              {locations.map(loc => (
                <label key={loc.location_id}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${locationId === loc.location_id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <input type="radio" name="location" value={loc.location_id}
                    checked={locationId === loc.location_id} onChange={() => setLocationId(loc.location_id)}
                    className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{loc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{loc.address}</p>
                    <a href={loc.maps_url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium">
                      <ExternalLink className="w-3 h-3" />Open in Maps
                    </a>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* OTP toggle */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${requireOtp ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
            onClick={() => setRequireOtp(!requireOtp)}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${requireOtp ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <KeyRound className={`w-4 h-4 ${requireOtp ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Require OTP</p>
                <p className="text-xs text-gray-400">{requireOtp ? 'OTP emailed to visitor' : 'Location only, no OTP'}</p>
              </div>
            </div>
            <div className="relative w-10 h-5 rounded-full flex-shrink-0" style={{ background: requireOtp ? '#3b82f6' : '#d1d5db' }}>
              <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: requireOtp ? '22px' : '2px' }} />
            </div>
          </div>

          {selectedLoc && (
            <div className="text-xs bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1 text-gray-500">
              <p className="font-semibold text-gray-700">Visitor email will include:</p>
              <p>📍 <strong className="text-gray-900">{selectedLoc.name}</strong></p>
              <p>{requireOtp ? '🔐 A 6-digit OTP' : '✅ No OTP required'}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || !locationId}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-colors"
            style={{ background: '#059669' }}>
            {submitting
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Check className="w-4 h-4" />}
            {submitting ? 'Approving…' : 'Approve & Notify'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Visit card ─────────────────────────────────────────────────────────── */
function VisitCard({
  visit: v, onAction, onApprove, onDismiss, updating,
}: {
  visit: Visit;
  onAction:  (id: string, s: VisitStatus) => void;
  onApprove: () => void;
  onDismiss: (id: string) => void;
  updating:  string | null;
}) {
  const isRejected  = v.status === 'rejected';
  const isPending   = v.status === 'pending';
  const isApproved  = v.status === 'approved';
  const isCheckedIn = v.status === 'checked_in';

  const borderColor = isPending ? '#fbbf24' : isApproved ? '#34d399' : isCheckedIn ? '#60a5fa' : '#f87171';

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md ${isRejected ? 'opacity-75' : ''}`}
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="p-3 lg:p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {v.visitor_thumbnail
            ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`}
                className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt="" />
            : <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-crimson-100 flex items-center justify-center text-crimson-600 text-lg font-bold flex-shrink-0">
                {v.visitor_name.charAt(0)}
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-sm lg:text-base leading-tight">{v.visitor_name}</p>
              <StatusDot status={v.status} />
            </div>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
              <span>📞 {v.visitor_phone}</span>
              <span className="truncate">✉ {v.visitor_email}</span>
              {v.purpose && <span className="sm:col-span-2">🏷 {v.purpose}</span>}
              {v.location_name && (
                <span className="sm:col-span-2 flex items-center gap-1 text-emerald-600 font-medium">
                  <MapPin className="w-3 h-3" />{v.location_name}
                </span>
              )}
              {v.otp && (
                <span className="sm:col-span-2 flex items-center gap-1 text-blue-600 font-mono font-bold">
                  <KeyRound className="w-3 h-3" />OTP: {v.otp}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-300 mt-1">
              {new Date(v.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {isRejected && (
            <button onClick={() => onDismiss(v.visit_id)}
              className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
        </div>

        {/* Action buttons */}
        {!isRejected && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
            {isPending && (
              <>
                <button onClick={onApprove} disabled={updating === v.visit_id + 'approved'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 lg:py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                  style={{ background: '#059669' }}>
                  {updating === v.visit_id + 'approved'
                    ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <UserCheck className="w-3.5 h-3.5" />}
                  Approve
                </button>
                <button onClick={() => onAction(v.visit_id, 'rejected')} disabled={updating === v.visit_id + 'rejected'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 lg:py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                  {updating === v.visit_id + 'rejected'
                    ? <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    : <X className="w-3.5 h-3.5" />}
                  Reject
                </button>
              </>
            )}
            {isApproved && (
              <>
                <button onClick={() => onAction(v.visit_id, 'checked_in')} disabled={updating === v.visit_id + 'checked_in'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 lg:py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors">
                  {updating === v.visit_id + 'checked_in'
                    ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <LogIn className="w-3.5 h-3.5" />}
                  Check In
                </button>
                <button onClick={() => onAction(v.visit_id, 'rejected')} disabled={updating === v.visit_id + 'rejected'}
                  className="w-10 flex items-center justify-center py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            {isCheckedIn && (
              <button onClick={() => onAction(v.visit_id, 'checked_out')} disabled={updating === v.visit_id + 'checked_out'}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 lg:py-2.5 rounded-xl text-sm font-semibold bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-50 transition-colors">
                {updating === v.visit_id + 'checked_out'
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <LogOut className="w-3.5 h-3.5" />}
                Check Out
              </button>
            )}
          </div>
        )}

        {isRejected && (
          <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-red-400 font-medium">Visit rejected</span>
            <button onClick={() => onDismiss(v.visit_id)}
              className="text-xs text-gray-400 hover:text-red-500 font-medium flex items-center gap-1 transition-colors">
              <Trash2 className="w-3 h-3" />Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const [visits, setVisits]             = useState<Visit[]>([]);
  const [locations, setLocations]       = useState<Location[]>([]);
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState<string | null>(null);
  const [approveVisit, setApproveVisit] = useState<Visit | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => { setDismissedIds(getDismissedIds()); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, locRes] = await Promise.all([
        visitApi.notifications(),   // ← uses new /my/notifications endpoint
        locationApi.list(),
      ]);
      setVisits(notifRes.data as Visit[]);
      setLocations(locRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleVisits = visits.filter(
    v => !(v.status === 'rejected' && dismissedIds.has(v.visit_id))
  );

  const updateStatus = async (visitId: string, status: VisitStatus) => {
    setUpdating(visitId + status);
    try {
      const { data } = await visitApi.updateStatus(visitId, status);
      setVisits(prev =>
        prev
          .map(v => v.visit_id === visitId ? { ...v, ...data } : v)
          .filter(v => v.status !== 'checked_out')
      );
      toast.success(`Visit ${status.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally { setUpdating(null); }
  };

  const handleApprove = async (locationId: string, requireOtp: boolean) => {
    if (!approveVisit) return;
    setUpdating(approveVisit.visit_id + 'approved');
    try {
      const { data } = await visitApi.updateStatus(approveVisit.visit_id, 'approved', locationId, requireOtp);
      setVisits(prev => prev.map(v => v.visit_id === approveVisit.visit_id ? { ...v, ...data } : v));
      toast.success('Approved — visitor notified!');
      setApproveVisit(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Approval failed');
    } finally { setUpdating(null); }
  };

  const dismissVisit = useCallback((visitId: string) => {
    addDismissedId(visitId);
    setDismissedIds(getDismissedIds());
    toast.success('Dismissed');
  }, []);

  const clearAllRejected = useCallback(() => {
    const ids = getDismissedIds();
    visibleVisits.filter(v => v.status === 'rejected').forEach(v => ids.add(v.visit_id));
    saveDismissedIds(ids);
    setDismissedIds(new Set(ids));
    toast.success('All rejected visits dismissed');
  }, [visibleVisits]);

  const pending  = visibleVisits.filter(v => v.status === 'pending');
  const active   = visibleVisits.filter(v => v.status === 'approved' || v.status === 'checked_in');
  const rejected = visibleVisits.filter(v => v.status === 'rejected');

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="animate-fade-in">
      {approveVisit && (
        <ApproveModal
          visit={approveVisit}
          locations={locations}
          onConfirm={handleApprove}
          onClose={() => setApproveVisit(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 lg:mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
            Visitor Approvals
            {pending.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-crimson-600 text-white text-xs font-bold animate-pulse-dot">
                {pending.length}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {todayStr} · Today's visits only
          </p>
        </div>
        <button onClick={load} className="btn-secondary flex-shrink-0">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : visibleVisits.length === 0 && visits.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">No visits today yet</p>
        </div>
      ) : visibleVisits.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">
            {visits.length} visit{visits.length !== 1 ? 's' : ''} today — all dismissed
          </p>
          <button
            onClick={() => { clearDismissedIds(); setDismissedIds(new Set()); }}
            className="mt-3 text-xs text-crimson-600 hover:text-crimson-700 font-medium underline underline-offset-2"
          >
            Restore dismissed
          </button>
        </div>
      ) : (
        <div className="space-y-5">

          {pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Awaiting Approval ({pending.length})
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {pending.map(v => (
                  <VisitCard key={v.visit_id} visit={v}
                    onAction={updateStatus} onApprove={() => setApproveVisit(v)}
                    onDismiss={dismissVisit} updating={updating} />
                ))}
              </div>
            </section>
          )}

          {active.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Active Visits ({active.length})
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {active.map(v => (
                  <VisitCard key={v.visit_id} visit={v}
                    onAction={updateStatus} onApprove={() => setApproveVisit(v)}
                    onDismiss={dismissVisit} updating={updating} />
                ))}
              </div>
            </section>
          )}

          {rejected.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rejected ({rejected.length})
                  </h2>
                </div>
                <button onClick={clearAllRejected}
                  className="text-xs text-gray-400 hover:text-red-500 font-medium flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3" />Clear all
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {rejected.map(v => (
                  <VisitCard key={v.visit_id} visit={v}
                    onAction={updateStatus} onApprove={() => setApproveVisit(v)}
                    onDismiss={dismissVisit} updating={updating} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}