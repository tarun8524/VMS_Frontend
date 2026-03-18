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

// ── Approval modal ────────────────────────────────────────────────────────────
function ApproveModal({
  visit,
  locations,
  onConfirm,
  onClose,
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
    try {
      await onConfirm(locationId, requireOtp);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900 text-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" /> Approve Visit
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Visitor summary */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {visit.visitor_thumbnail ? (
              <img src={`data:image/jpeg;base64,${visit.visitor_thumbnail}`}
                className="w-12 h-12 rounded-xl object-cover" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-crimson-100 flex items-center justify-center text-crimson-600 font-bold text-lg">
                {visit.visitor_name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{visit.visitor_name}</p>
              <p className="text-xs text-gray-400">{visit.visitor_email}</p>
            </div>
          </div>

          {/* Location picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              <MapPin className="inline w-3.5 h-3.5 mr-1 text-crimson-500" />
              Meeting Location <span className="text-crimson-500">*</span>
            </label>
            <div className="grid gap-2">
              {locations.map((loc) => (
                <label key={loc.location_id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    locationId === loc.location_id
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <input type="radio" name="location" value={loc.location_id}
                    checked={locationId === loc.location_id}
                    onChange={() => setLocationId(loc.location_id)}
                    className="mt-0.5 accent-emerald-600" />
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
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
            requireOtp ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
          }`} onClick={() => setRequireOtp(!requireOtp)}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                requireOtp ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <KeyRound className={`w-4 h-4 ${requireOtp ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Require OTP</p>
                <p className="text-xs text-gray-400">
                  {requireOtp
                    ? 'OTP will be emailed to visitor'
                    : 'Visitor enters without OTP verification'}
                </p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${requireOtp ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                requireOtp ? 'translate-x-5.5' : 'translate-x-0.5'
              }`} style={{ transform: requireOtp ? 'translateX(22px)' : 'translateX(2px)' }} />
            </div>
          </div>

          {/* Summary */}
          {selectedLoc && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
              <p>📧 Visitor will receive an email with:</p>
              <p className="pl-3">📍 Location: <strong>{selectedLoc.name}</strong></p>
              {requireOtp
                ? <p className="pl-3">🔐 A 6-digit OTP to show at reception</p>
                : <p className="pl-3">✅ Entry without OTP — location only</p>
              }
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting || !locationId}
              className="btn-primary flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Check className="w-4 h-4" />
              }
              {submitting ? 'Approving…' : 'Approve & Notify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Action config (no 'approved' button — handled via modal) ──────────────────
type ActionBtn = { label: string; status: VisitStatus; icon: React.ElementType; cls: string };

const ACTIONS: Record<string, ActionBtn[]> = {
  pending: [
    { label: 'Reject', status: 'rejected', icon: X, cls: 'bg-red-500 hover:bg-red-600 text-white' },
  ],
  approved: [
    { label: 'Check In',  status: 'checked_in',  icon: LogIn,  cls: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Reject',    status: 'rejected',     icon: X,      cls: 'bg-red-500 hover:bg-red-600 text-white' },
  ],
  checked_in: [
    { label: 'Check Out', status: 'checked_out', icon: LogOut, cls: 'bg-gray-700 hover:bg-gray-800 text-white' },
  ],
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [visits, setVisits]     = useState<Visit[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [approveVisit, setApproveVisit] = useState<Visit | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: v }, { data: locs }] = await Promise.all([
        visitApi.myVisits(),
        locationApi.list(),
      ]);
      setVisits(v.filter((x: Visit) => x.status !== 'checked_out'));
      setLocations(locs);
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
      setVisits((prev) =>
        prev
          .map((v) => v.visit_id === visitId ? { ...v, ...data } : v)
          .filter((v) => v.status !== 'checked_out')
      );
      toast.success(`Visit ${status.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleApprove = async (locationId: string, requireOtp: boolean) => {
    if (!approveVisit) return;
    setUpdating(approveVisit.visit_id + 'approved');
    try {
      const { data } = await visitApi.updateStatus(
        approveVisit.visit_id, 'approved', locationId, requireOtp
      );
      setVisits((prev) =>
        prev.map((v) => v.visit_id === approveVisit.visit_id ? { ...v, ...data } : v)
      );
      toast.success('Visit approved — visitor notified by email!');
      setApproveVisit(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Approval failed');
    } finally {
      setUpdating(null);
    }
  };

  const pending = visits.filter((v) => v.status === 'pending');
  const active  = visits.filter((v) => v.status !== 'pending');

  return (
    <div className="animate-fade-in">
      {/* Approve modal */}
      {approveVisit && (
        <ApproveModal
          visit={approveVisit}
          locations={locations}
          onConfirm={handleApprove}
          onClose={() => setApproveVisit(null)}
        />
      )}

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
          {/* Pending */}
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
                  <VisitCard
                    key={v.visit_id}
                    visit={v}
                    onAction={updateStatus}
                    onApprove={() => setApproveVisit(v)}
                    updating={updating}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Active */}
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
                  <VisitCard
                    key={v.visit_id}
                    visit={v}
                    onAction={updateStatus}
                    onApprove={() => setApproveVisit(v)}
                    updating={updating}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function VisitCard({
  visit: v,
  onAction,
  onApprove,
  updating,
}: {
  visit: Visit;
  onAction: (id: string, s: VisitStatus) => void;
  onApprove: () => void;
  updating: string | null;
}) {
  const actions = ACTIONS[v.status] || [];

  return (
    <div className={`card shadow-card flex flex-col sm:flex-row gap-4 animate-slide-up ${
      v.status === 'pending'  ? 'border-l-4 border-l-amber-400' :
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
          {v.location_name && (
            <span className="sm:col-span-2 flex items-center gap-1 text-emerald-700">
              <MapPin className="w-3.5 h-3.5" /> {v.location_name}
            </span>
          )}
          {v.otp && (
            <span className="sm:col-span-2 flex items-center gap-1 text-blue-700 font-mono font-bold">
              <KeyRound className="w-3.5 h-3.5" /> OTP: {v.otp}
            </span>
          )}
          <span className="text-xs text-gray-400 sm:col-span-2">
            Requested {new Date(v.created_at).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex sm:flex-col gap-2 flex-shrink-0 self-center sm:self-start">
        {/* Approve button — only for pending */}
        {v.status === 'pending' && (
          <button
            onClick={onApprove}
            disabled={updating === v.visit_id + 'approved'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            {updating === v.visit_id + 'approved'
              ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Check className="w-3.5 h-3.5" />
            }
            Approve
          </button>
        )}

        {/* Other action buttons */}
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
    </div>
  );
}
