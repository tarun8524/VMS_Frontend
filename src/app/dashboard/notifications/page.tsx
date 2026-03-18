'use client';
import { useEffect, useState } from 'react';
import {
  Bell, Check, X, RefreshCw, Clock, LogIn, LogOut,
  MapPin, KeyRound, ExternalLink,
} from 'lucide-react';
import { visitApi, locationApi } from '@/lib/api';
import { Visit, VisitStatus, Location } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

// ── Approval modal ─────────────────────────────────────────────────────────────
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
  const selectedLoc = locations.find((l) => l.location_id === locationId);

  const handleSubmit = async () => {
    if (!locationId) { toast.error('Please select a meeting location'); return; }
    setSubmitting(true);
    try { await onConfirm(locationId, requireOtp); }
    finally { setSubmitting(false); }
  };

  return (
    // Outer wrapper: on mobile align to bottom but with bottom padding = nav height (64px)
    // On sm+ center it
    <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center"
      style={{ paddingBottom: '64px' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 130px)' }}
      >
        {/* ── Sticky header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900 lg:text-lg flex items-center gap-2">
            <Check className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" /> Approve Visit
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 lg:p-6 flex flex-col gap-4 lg:gap-5">

          {/* Visitor summary */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {visit.visitor_thumbnail ? (
              <img src={`data:image/jpeg;base64,${visit.visitor_thumbnail}`}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold lg:text-lg">
                {visit.visitor_name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 text-sm lg:text-base">{visit.visitor_name}</p>
              <p className="text-xs text-gray-400">{visit.visitor_email}</p>
            </div>
          </div>

          {/* Location picker */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              <MapPin className="inline w-3.5 h-3.5 mr-1 text-red-500" />
              Meeting Location <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-col gap-2">
              {locations.map((loc) => (
                <label key={loc.location_id}
                  className={`flex items-start gap-3 p-3 lg:p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    locationId === loc.location_id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'
                  }`}>
                  <input type="radio" name="location" value={loc.location_id}
                    checked={locationId === loc.location_id}
                    onChange={() => setLocationId(loc.location_id)}
                    className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{loc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{loc.address}</p>
                    <a href={loc.maps_url} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium">
                      <ExternalLink className="w-3 h-3" /> Open in Maps
                    </a>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* OTP toggle */}
          <div
            className={`flex items-center justify-between p-3 lg:p-4 rounded-xl border-2 cursor-pointer transition-all ${
              requireOtp ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
            }`}
            onClick={() => setRequireOtp(!requireOtp)}
          >
            <div className="flex items-center gap-2.5 lg:gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${requireOtp ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <KeyRound className={`w-4 h-4 ${requireOtp ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Require OTP</p>
                <p className="text-xs text-gray-400">{requireOtp ? 'OTP will be emailed to visitor' : 'Location only, no OTP'}</p>
              </div>
            </div>
            <div className="relative w-10 h-5 rounded-full flex-shrink-0" style={{ background: requireOtp ? '#3b82f6' : '#d1d5db' }}>
              <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: requireOtp ? '22px' : '2px' }} />
            </div>
          </div>

          {selectedLoc && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1">
              <p className="font-semibold text-gray-700 mb-1">Visitor email will include:</p>
              <p>📍 Location: <strong className="text-gray-900">{selectedLoc.name}</strong></p>
              <p>{requireOtp ? '🔐 A 6-digit OTP' : '✅ No OTP required'}</p>
            </div>
          )}
        </div>

        {/* ── Sticky footer buttons — always visible ── */}
        <div className="flex gap-2 lg:gap-3 px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm active:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || !locationId}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
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

// ── Actions config ─────────────────────────────────────────────────────────────
type ActionBtn = { label: string; status: VisitStatus; icon: React.ElementType; cls: string };

const ACTIONS: Record<string, ActionBtn[]> = {
  pending:    [{ label: 'Reject',    status: 'rejected',    icon: X,      cls: 'bg-red-500 hover:bg-red-600 text-white' }],
  approved:   [
    { label: 'Check In', status: 'checked_in', icon: LogIn,  cls: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Reject',   status: 'rejected',   icon: X,      cls: 'bg-red-500 hover:bg-red-600 text-white' },
  ],
  checked_in: [{ label: 'Check Out', status: 'checked_out', icon: LogOut, cls: 'bg-gray-700 hover:bg-gray-800 text-white' }],
};

// ── Main page ──────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [visits, setVisits]         = useState<Visit[]>([]);
  const [locations, setLocations]   = useState<Location[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [approveVisit, setApproveVisit] = useState<Visit | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: v }, { data: locs }] = await Promise.all([visitApi.myVisits(), locationApi.list()]);
      setVisits(v.filter((x: Visit) => x.status !== 'checked_out'));
      setLocations(locs);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (visitId: string, status: VisitStatus) => {
    setUpdating(visitId + status);
    try {
      const { data } = await visitApi.updateStatus(visitId, status);
      setVisits((prev) =>
        prev.map((v) => v.visit_id === visitId ? { ...v, ...data } : v)
            .filter((v) => v.status !== 'checked_out')
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
      setVisits((prev) => prev.map((v) => v.visit_id === approveVisit.visit_id ? { ...v, ...data } : v));
      toast.success('Approved — visitor notified!');
      setApproveVisit(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Approval failed');
    } finally { setUpdating(null); }
  };

  const pending = visits.filter((v) => v.status === 'pending');
  const active  = visits.filter((v) => v.status !== 'pending');

  return (
    <div className="animate-fade-in">
      {approveVisit && (
        <ApproveModal visit={approveVisit} locations={locations}
          onConfirm={handleApprove} onClose={() => setApproveVisit(null)} />
      )}

      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 lg:gap-3">
            Visitor Approvals
            {pending.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-crimson-600 text-white text-xs font-bold animate-pulse-dot">
                {pending.length}
              </span>
            )}
          </h1>
          <p className="text-xs lg:text-sm text-gray-500 mt-0.5 lg:mt-1">Review and manage incoming visitor requests</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3 lg:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 lg:h-32 bg-white rounded-xl lg:rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="card text-center py-16 lg:py-20">
          <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 lg:mb-4">
            <Bell className="w-6 h-6 lg:w-8 lg:h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600 text-sm lg:text-base">All caught up!</p>
          <p className="text-xs lg:text-sm text-gray-400 mt-1">No pending or active visits right now</p>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          {pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2 lg:mb-3">
                <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-500" />
                <h2 className="text-xs lg:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Awaiting Approval ({pending.length})
                </h2>
              </div>
              <div className="grid gap-2 lg:gap-3">
                {pending.map((v) => (
                  <VisitCard key={v.visit_id} visit={v}
                    onAction={updateStatus} onApprove={() => setApproveVisit(v)} updating={updating} />
                ))}
              </div>
            </section>
          )}
          {active.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2 lg:mb-3">
                <LogIn className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-500" />
                <h2 className="text-xs lg:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Active Visits ({active.length})
                </h2>
              </div>
              <div className="grid gap-2 lg:gap-3">
                {active.map((v) => (
                  <VisitCard key={v.visit_id} visit={v}
                    onAction={updateStatus} onApprove={() => setApproveVisit(v)} updating={updating} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ── Visit card ─────────────────────────────────────────────────────────────────
function VisitCard({ visit: v, onAction, onApprove, updating }: {
  visit: Visit;
  onAction: (id: string, s: VisitStatus) => void;
  onApprove: () => void;
  updating: string | null;
}) {
  const actions = ACTIONS[v.status] || [];
  const borderColor = v.status === 'pending' ? '#fbbf24' : v.status === 'approved' ? '#34d399' : '#60a5fa';

  return (
    <div className="card shadow-card animate-slide-up" style={{ borderLeft: `4px solid ${borderColor}` }}>

      {/* Mobile layout: stacked */}
      <div className="flex items-start gap-3">
        {v.visitor_thumbnail ? (
          <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`}
            className="w-12 h-12 lg:w-20 lg:h-20 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt={v.visitor_name} />
        ) : (
          <div className="w-12 h-12 lg:w-20 lg:h-20 rounded-xl bg-red-100 flex items-center justify-center text-red-600 text-lg lg:text-2xl font-bold flex-shrink-0">
            {v.visitor_name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm lg:text-lg leading-tight">{v.visitor_name}</h3>
            <StatusBadge status={v.status} />
          </div>
          <div className="mt-1 lg:mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 lg:gap-y-1 text-xs lg:text-sm text-gray-500">
            <span>📞 {v.visitor_phone}</span>
            <span>✉ {v.visitor_email}</span>
            {v.purpose && <span className="sm:col-span-2">🏷 {v.purpose}</span>}
            {v.location_name && (
              <span className="sm:col-span-2 flex items-center gap-1 text-emerald-700 font-medium">
                <MapPin className="w-3 h-3" /> {v.location_name}
              </span>
            )}
            {v.otp && (
              <span className="sm:col-span-2 flex items-center gap-1 text-blue-700 font-mono font-bold">
                <KeyRound className="w-3 h-3" /> OTP: {v.otp}
              </span>
            )}
            <span className="text-xs text-gray-400 sm:col-span-2 mt-0.5">
              {new Date(v.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Desktop: action buttons inline */}
        <div className="hidden lg:flex flex-col gap-2 flex-shrink-0 self-start">
          {v.status === 'pending' && (
            <button onClick={onApprove}
              disabled={updating === v.visit_id + 'approved'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: '#059669' }}>
              {updating === v.visit_id + 'approved'
                ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Check className="w-3.5 h-3.5" />}
              Approve
            </button>
          )}
          {actions.map(({ label, status, icon: Icon, cls }) => {
            const key = v.visit_id + status;
            return (
              <button key={status} onClick={() => onAction(v.visit_id, status)}
                disabled={updating === key}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${cls}`}>
                {updating === key
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Icon className="w-3.5 h-3.5" />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: action buttons below */}
      {(v.status === 'pending' || actions.length > 0) && (
        <div className="lg:hidden flex gap-2 mt-3 pt-3 border-t border-gray-50">
          {v.status === 'pending' && (
            <button onClick={onApprove}
              disabled={updating === v.visit_id + 'approved'}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#059669' }}>
              {updating === v.visit_id + 'approved'
                ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Check className="w-3.5 h-3.5" />}
              Approve
            </button>
          )}
          {actions.map(({ label, status, icon: Icon, cls }) => {
            const key = v.visit_id + status;
            return (
              <button key={status} onClick={() => onAction(v.visit_id, status)}
                disabled={updating === key}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${cls}`}>
                {updating === key
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Icon className="w-3.5 h-3.5" />}
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}