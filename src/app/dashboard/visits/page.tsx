'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  RefreshCw, Users, X, Clock, MapPin, Calendar,
  ChevronLeft, ChevronRight, KeyRound, ChevronUp, ChevronDown,
} from 'lucide-react';
import { visitApi } from '@/lib/api';
import { Visit, VisitStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

const TABS: { label: string; value: string }[] = [
  { label: 'All',          value: ''            },
  { label: 'Pending',      value: 'pending'     },
  { label: 'Approved',     value: 'approved'    },
  { label: 'Checked In',   value: 'checked_in'  },
  { label: 'Checked Out',  value: 'checked_out' },
  { label: 'Rejected',     value: 'rejected'    },
];

type SortKey = 'visitor_name' | 'created_at' | 'status' | 'purpose';
type SortDir = 'asc' | 'desc';

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: '2-digit',
  });
}

// ── Pagination ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [15, 30, 50] as const;

function Pagination({ total, page, pageSize, onPage, onPageSize }: {
  total: number; page: number; pageSize: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 flex-wrap gap-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        Show
        <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg">
          {PAGE_SIZES.map(s => (
            <button key={s} onClick={() => { onPageSize(s); onPage(1); }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${pageSize === s ? 'bg-white text-crimson-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
        per page · <span className="font-medium text-gray-700">{total}</span> visit{total !== 1 ? 's' : ''}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onPage(page - 1)} disabled={page === 1}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 5) p = i + 1;
            else if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
            return (
              <button key={p} onClick={() => onPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${page === p ? 'bg-crimson-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p}
              </button>
            );
          })}
          <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sortable column header ────────────────────────────────────────────────────
function SortTh({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey;
  current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 cursor-pointer hover:text-gray-600 select-none whitespace-nowrap group"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
          {active && dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </span>
    </th>
  );
}

// ── Visitor Detail Modal ──────────────────────────────────────────────────────
function VisitorDetailModal({
  visit,
  allRecords,
  onClose,
}: {
  visit: Visit;
  allRecords: Visit[];
  onClose: () => void;
}) {
  const [recPage, setRecPage]     = useState(1);
  const [recPageSize, setRecPageSize] = useState<typeof PAGE_SIZES[number]>(15);

  const approvedCnt = allRecords.filter(v =>
    ['approved', 'checked_in', 'checked_out'].includes(v.status)
  ).length;

  const timeSpentMap = useMemo(() => {
    const m: Record<string, string> = {};
    allRecords.forEach(v => {
      if (v.status === 'checked_out' && v.updated_at && v.created_at) {
        const mins = Math.round(
          (new Date(v.updated_at).getTime() - new Date(v.created_at).getTime()) / 60000
        );
        if (mins > 0)
          m[v.visit_id] = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
      }
    });
    return m;
  }, [allRecords]);

  const lastStay = Object.values(timeSpentMap).slice(-1)[0];
  const pagedRec = allRecords.slice((recPage - 1) * recPageSize, recPage * recPageSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col animate-slide-up overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 80px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {visit.visitor_thumbnail
              ? <img src={`data:image/jpeg;base64,${visit.visitor_thumbnail}`}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-200 flex-shrink-0" alt="" />
              : <div className="w-14 h-14 rounded-2xl bg-crimson-100 flex items-center justify-center text-crimson-600 text-xl font-bold flex-shrink-0">
                  {visit.visitor_name.charAt(0)}
                </div>
            }
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg leading-tight">{visit.visitor_name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{visit.visitor_email}</p>
              <p className="text-xs text-gray-400">{visit.visitor_phone}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Selected visit details */}
          <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={visit.status} />
              {visit.purpose && <span className="text-gray-600 text-xs">🏷 {visit.purpose}</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />{fmtDateTime(visit.created_at)}
              </span>
              {visit.location_name && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <MapPin className="w-3 h-3" />{visit.location_name}
                </span>
              )}
              {visit.otp && (
                <span className="flex items-center gap-1 text-blue-600 font-mono font-bold">
                  <KeyRound className="w-3 h-3" />OTP: {visit.otp}
                </span>
              )}
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex gap-2 mt-3">
            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-lg font-bold text-gray-900">{allRecords.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Total visits</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-lg font-bold text-emerald-700">{approvedCnt}</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">Approved</p>
            </div>
            {lastStay && (
              <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                <p className="text-base font-bold text-blue-700">{lastStay}</p>
                <p className="text-[10px] text-blue-400 mt-0.5">Last stay</p>
              </div>
            )}
          </div>
        </div>

        {/* Full records table */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="px-5 py-2.5 border-b border-gray-50 bg-gray-50/50 flex-shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              All Visit Records ({allRecords.length})
            </p>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-50">
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">#</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Date & Time</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Status</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Purpose</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Location</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedRec.map((v, i) => (
                  <tr key={v.visit_id}
                    className={`hover:bg-gray-50 transition-colors ${v.visit_id === visit.visit_id ? 'bg-crimson-50/40' : ''}`}>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      #{(recPage - 1) * recPageSize + i + 1}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {fmtDateTime(v.created_at)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                      {v.purpose || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-emerald-600 whitespace-nowrap">
                      {v.location_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-blue-600 font-semibold whitespace-nowrap">
                      {timeSpentMap[v.visit_id] || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            total={allRecords.length} page={recPage} pageSize={recPageSize}
            onPage={setRecPage} onPageSize={s => setRecPageSize(s as any)} />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VisitsPage() {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [visits, setVisits]             = useState<Visit[]>([]);
  const [tab, setTab]                   = useState('');
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selected, setSelected]         = useState<Visit | null>(null);
  const [allRecords, setAllRecords]     = useState<Visit[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Table state
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(15);
  const [sortKey, setSortKey]   = useState<SortKey>('created_at');
  const [sortDir, setSortDir]   = useState<SortDir>('desc');

  const load = useCallback(async (status: string, date: string) => {
    setLoading(true);
    try {
      const { data } = await visitApi.myVisits(status || undefined, false, date || undefined);
      setVisits(data);
      setPage(1);
    } catch { toast.error('Failed to load visits'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab, selectedDate); }, [tab, selectedDate, load]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const sorted = useMemo(() => {
    return [...visits].sort((a, b) => {
      let va: any = a[sortKey as keyof Visit] ?? '';
      let vb: any = b[sortKey as keyof Visit] ?? '';
      if (sortKey === 'created_at') {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [visits, sortKey, sortDir]);

  const paged = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize]
  );

  const openDetail = useCallback(async (visit: Visit) => {
    setSelected(visit);
    setAllRecords([]);
    setRecordsLoading(true);
    try {
      const { data } = await visitApi.visitorRecords(visit.visitor_uid);
      setAllRecords(Array.isArray(data) ? data : [visit]);
    } catch { setAllRecords([visit]); }
    finally { setRecordsLoading(false); }
  }, []);

  const isToday  = selectedDate === todayStr;
  const dayLabel = isToday
    ? 'Today'
    : new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { '': visits.length };
    visits.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return counts;
  }, [visits]);

  const statusBorderColor: Record<VisitStatus, string> = {
    pending:     '#fbbf24',
    approved:    '#34d399',
    rejected:    '#f87171',
    checked_in:  '#60a5fa',
    checked_out: '#9ca3af',
  };

  return (
    <div className="animate-fade-in">
      {/* Loading overlay for records */}
      {recordsLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-crimson-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Loading visitor records…</span>
          </div>
        </div>
      )}

      {selected && !recordsLoading && (
        <VisitorDetailModal
          visit={selected}
          allRecords={allRecords.length > 0 ? allRecords : [selected]}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Visit Records</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            📅 {dayLabel} ·{' '}
            <span className="font-medium">{visits.length} visit{visits.length !== 1 ? 's' : ''}</span>
          </p>
        </div>
        <button onClick={() => load(tab, selectedDate)} className="btn-secondary flex-shrink-0">
          <RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Controls row: date nav + tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Date navigation */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().slice(0, 10));
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <input
            type="date" value={selectedDate} max={todayStr}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs border-0 bg-transparent text-gray-700 font-medium focus:outline-none px-1 cursor-pointer"
          />
          <button
            onClick={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate() + 1);
              const next = d.toISOString().slice(0, 10);
              if (next <= todayStr) setSelectedDate(next);
            }}
            disabled={selectedDate >= todayStr}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {!isToday && (
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="text-xs text-crimson-600 font-semibold flex items-center gap-1 px-3 py-1.5 bg-crimson-50 rounded-lg border border-crimson-100 hover:bg-crimson-100 transition-colors">
            <Calendar className="w-3 h-3" />Today
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4 overflow-x-auto max-w-full">
        {TABS.map(t => (
          <button key={t.value} onClick={() => { setTab(t.value); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 lg:px-4 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${tab === t.value ? 'bg-white text-crimson-700 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            {(tabCounts[t.value] ?? 0) > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === t.value ? 'bg-crimson-100 text-crimson-700' : 'bg-gray-200 text-gray-500'}`}>
                {tabCounts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
                  <div className="h-2.5 bg-gray-50 rounded animate-pulse w-48" />
                </div>
                <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-3 w-20 bg-gray-50 rounded animate-pulse hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16">
          <Users className="w-10 h-10 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium text-sm">No visits found</p>
          <p className="text-xs text-gray-400 mt-1">
            {isToday ? 'No visits today yet' : `No visits on ${fmtDate(selectedDate)}`}
            {tab && ` with status "${tab}"`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 w-10">#</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Visitor</th>
                  <SortTh label="Date" sortKey="created_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="Purpose" sortKey="purpose" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Location</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">OTP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.map((v, i) => (
                  <tr key={v.visit_id}
                    onClick={() => openDetail(v)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    style={{ borderLeft: `3px solid ${statusBorderColor[v.status]}` }}
                  >
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {v.visitor_thumbnail
                          ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0" alt="" />
                          : <div className="w-8 h-8 rounded-full bg-crimson-100 text-crimson-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {v.visitor_name.charAt(0)}
                            </div>
                        }
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 group-hover:text-crimson-700 transition-colors truncate max-w-[130px]">
                            {v.visitor_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[150px]">{v.visitor_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {fmtDateTime(v.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">
                      {v.purpose || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-emerald-600 whitespace-nowrap">
                      {v.location_name
                        ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.location_name}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {v.otp
                        ? <span className="text-blue-600 font-bold flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />{v.otp}
                          </span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-gray-50">
            {paged.map((v, i) => (
              <div key={v.visit_id}
                onClick={() => openDetail(v)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ borderLeft: `3px solid ${statusBorderColor[v.status]}` }}
              >
                {/* Row number */}
                <span className="text-[10px] text-gray-300 font-mono mt-1 w-5 flex-shrink-0">
                  {(page - 1) * pageSize + i + 1}
                </span>
                {/* Avatar */}
                {v.visitor_thumbnail
                  ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`}
                      className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt="" />
                  : <div className="w-10 h-10 rounded-xl bg-crimson-100 text-crimson-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {v.visitor_name.charAt(0)}
                    </div>
                }
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900 truncate">{v.visitor_name}</p>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="text-xs text-gray-400 truncate">{v.visitor_email}</p>
                  <p className="text-xs text-gray-400">{v.visitor_phone}</p>
                  {v.purpose && <p className="text-xs text-gray-500 mt-0.5 truncate">🏷 {v.purpose}</p>}
                  <div className="flex flex-wrap gap-x-3 mt-0.5 text-[10px] text-gray-400">
                    <span>{fmtDateTime(v.created_at)}</span>
                    {v.location_name && <span className="text-emerald-600">{v.location_name}</span>}
                    {v.otp && <span className="text-blue-600 font-mono font-bold">OTP: {v.otp}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            total={visits.length} page={page} pageSize={pageSize}
            onPage={setPage} onPageSize={s => setPageSize(s as any)} />
        </div>
      )}
    </div>
  );
}