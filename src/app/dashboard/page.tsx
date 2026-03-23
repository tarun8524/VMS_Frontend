'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users, Clock, CheckCircle, Calendar, TrendingUp,
  ArrowRight, BarChart3, Activity, XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { visitApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DashboardStats, Visit, TimeRange } from '@/types';

// ── IST helpers ────────────────────────────────────────────────────────────────
// The backend now stores NAIVE IST datetimes in MongoDB (stripped of tzinfo).
// Motor serialises these as ISO strings WITHOUT a timezone suffix, e.g.:
//   "2024-03-15T15:40:00"   ← already IST wall-clock, no conversion needed
//
// JavaScript's Date constructor treats a no-suffix ISO string as LOCAL time
// when running in a browser, which may not be IST.  To be safe we parse the
// raw numeric fields directly so we never rely on JS timezone.

function parseISTString(iso: string): { y:number; mo:number; d:number; h:number; m:number; s:number } {
  // Handles both "2024-03-15T15:40:00" and "2024-03-15T15:40:00.000000"
  // Strips any trailing Z / +offset just in case (shouldn't appear from new data)
  const clean = iso.replace(/[Z+].*$/, '').replace(/\.\d+$/, '');
  const [datePart, timePart = '00:00:00'] = clean.split('T');
  const [y, mo, d]  = datePart.split('-').map(Number);
  const [h, m, s]   = timePart.split(':').map(Number);
  return { y, mo, d, h, m, s };
}

/** Return a plain object with IST hour/day from a stored ISO string. */
function istFromISO(iso: string) {
  return parseISTString(iso);
}

/** Current IST wall-clock as { h, dayOfWeek, fullMs } */
function nowIST() {
  // Use the Intl API to get true IST regardless of browser timezone
  const now     = new Date();
  const istParts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short',
  }).formatToParts(now);

  const get = (type: string) => Number(istParts.find(p => p.type === type)?.value ?? '0');
  return {
    h:          get('hour'),
    minute:     get('minute'),
    day:        get('day'),
    month:      get('month'),
    year:       get('year'),
    weekday:    istParts.find(p => p.type === 'weekday')?.value ?? '',
    utcMs:      now.getTime(),
  };
}

/** Format an hour (0-23) as "6PM", "12AM", "3AM" etc. */
function fmtHour(h: number): string {
  if (h === 0)  return '12AM';
  if (h === 12) return '12PM';
  return h < 12 ? `${h}AM` : `${h - 12}PM`;
}

/** Format a 3-hour slot range */
function fmtSlotRange(startHour: number): string {
  const endHour = (startHour + 3) % 24;
  return `${fmtHour(startHour)}–${fmtHour(endHour)}`;
}

function getGreeting() {
  const { h } = nowIST();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function fmtDate(iso: string) {
  const { d, mo } = istFromISO(iso);  // ✅ use 'mo' directly
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[mo - 1]}`;
}

interface ChartPoint {
  label:        string;
  tooltipLabel: string;
  total:    number;
  pending:  number;
  approved: number;
  rejected: number;
}

function tally(bucket: ChartPoint, status: string) {
  bucket.total++;
  if (status === 'pending') bucket.pending++;
  if (['approved', 'checked_in', 'checked_out'].includes(status)) bucket.approved++;
  if (status === 'rejected') bucket.rejected++;
}

// ── IST-aware chart data builder ───────────────────────────────────────────────
function buildChartData(visits: Visit[], range: TimeRange): ChartPoint[] {
  const cur = nowIST();
  const buckets: ChartPoint[] = [];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (range === '24h') {
    // 8 slots × 3 h = 24 h; anchor to the current 3-h slot in IST
    const currentSlotHour = Math.floor(cur.h / 3) * 3;
    for (let i = 7; i >= 0; i--) {
      const slotHour = ((currentSlotHour - i * 3) % 24 + 24) % 24;
      buckets.push({ label: fmtSlotRange(slotHour), tooltipLabel: fmtSlotRange(slotHour),
                     total: 0, pending: 0, approved: 0, rejected: 0 });
    }
    visits.forEach(v => {
      const ist = istFromISO(v.created_at);
      // Compute milliseconds ago using UTC timestamps for accurate window check
      const visitUtcMs = new Date(v.created_at.endsWith('Z') ? v.created_at : v.created_at + '+05:30').getTime();
      const msAgo = cur.utcMs - visitUtcMs;
      if (msAgo < 0 || msAgo >= 86400000) return;
      const visitSlotHour = Math.floor(ist.h / 3) * 3;
      const idx = buckets.findIndex(b => b.label === fmtSlotRange(visitSlotHour));
      if (idx !== -1) tally(buckets[idx], v.status);
    });

  } else if (range === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(cur.utcMs - i * 86400000);
      const parts = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata', weekday: 'short',
      }).formatToParts(d);
      const wd = parts.find(p => p.type === 'weekday')?.value ?? '';
      buckets.push({ label: wd, tooltipLabel: wd,
                     total: 0, pending: 0, approved: 0, rejected: 0 });
    }
    visits.forEach(v => {
      const visitUtcMs = new Date(v.created_at.endsWith('Z') ? v.created_at : v.created_at + '+05:30').getTime();
      const daysAgo = Math.floor((cur.utcMs - visitUtcMs) / 86400000);
      if (daysAgo < 0 || daysAgo >= 7) return;
      if (buckets[6 - daysAgo]) tally(buckets[6 - daysAgo], v.status);
    });

  } else if (range === '30d') {
    for (let w = 3; w >= 0; w--) {
      buckets.push({ label: w === 0 ? 'This wk' : `${w}w ago`,
                     tooltipLabel: w === 0 ? 'This week' : `${w} week${w > 1 ? 's' : ''} ago`,
                     total: 0, pending: 0, approved: 0, rejected: 0 });
    }
    visits.forEach(v => {
      const visitUtcMs = new Date(v.created_at.endsWith('Z') ? v.created_at : v.created_at + '+05:30').getTime();
      const daysAgo = Math.floor((cur.utcMs - visitUtcMs) / 86400000);
      const idx = 3 - Math.min(3, Math.floor(daysAgo / 7));
      if (daysAgo >= 0 && daysAgo < 28 && buckets[idx]) tally(buckets[idx], v.status);
    });

  } else {
    // 'all' — last 6 calendar months
    for (let m = 5; m >= 0; m--) {
      const d = new Date(cur.utcMs);
      d.setMonth(d.getMonth() - m);
      const mo = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata', month: 'short',
      }).format(d);
      buckets.push({ label: mo, tooltipLabel: mo,
                     total: 0, pending: 0, approved: 0, rejected: 0 });
    }
    visits.forEach(v => {
      const ist      = istFromISO(v.created_at);
      const monthsAgo = (cur.year - ist.y) * 12 + (cur.month - ist.mo);
      if (monthsAgo >= 0 && monthsAgo < 6 && buckets[5 - monthsAgo]) {
        tally(buckets[5 - monthsAgo], v.status);
      }
    });
  }

  return buckets;
}

// ── Bar Chart ──────────────────────────────────────────────────────────────────
function BarChart({ data, range }: { data: ChartPoint[]; range: TimeRange }) {
  const max = Math.max(...data.map(d => d.total), 1);
  const [hovered, setHovered] = useState<number | null>(null);
  const is24h = range === '24h';

  return (
    <div className="relative select-none">
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col justify-end h-full gap-px cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="w-full rounded-t-sm transition-all duration-300"
              style={{ height: `${(d.approved / max) * 80}px`, backgroundColor: hovered === i ? '#10b981' : '#34d399', minHeight: d.approved > 0 ? 2 : 0 }} />
            <div className="w-full transition-all duration-300"
              style={{ height: `${(d.pending / max) * 80}px`, backgroundColor: hovered === i ? '#f59e0b' : '#fbbf24', minHeight: d.pending > 0 ? 2 : 0 }} />
            <div className="w-full rounded-b-sm transition-all duration-300"
              style={{ height: `${(d.rejected / max) * 80}px`, backgroundColor: hovered === i ? '#ef4444' : '#f87171', minHeight: d.rejected > 0 ? 2 : 0 }} />
            {d.total === 0 && <div className="w-full h-0.5 rounded bg-gray-100" />}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hovered !== null && (
        <div className="absolute z-10 pointer-events-none"
          style={{
            bottom: '100%',
            left: `calc(${(hovered / data.length) * 100 + (50 / data.length)}%)`,
            transform: 'translateX(-50%)',
            marginBottom: 6,
          }}>
          <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
            <p className="font-semibold">{data[hovered].tooltipLabel}</p>
            <p className="text-gray-300">{data[hovered].total} total</p>
            {data[hovered].approved > 0 && <p className="text-emerald-400">✓ {data[hovered].approved} approved</p>}
            {data[hovered].pending > 0  && <p className="text-amber-400">⏳ {data[hovered].pending} pending</p>}
            {data[hovered].rejected > 0 && <p className="text-red-400">✗ {data[hovered].rejected} rejected</p>}
          </div>
        </div>
      )}

      {/* X-axis labels */}
      <div className="flex items-start gap-1.5 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center overflow-hidden">
            <span
              className={`block text-center font-mono leading-tight transition-colors ${
                hovered === i ? 'text-gray-700' : 'text-gray-400'
              } ${is24h ? 'text-[8px]' : 'text-[10px]'}`}
            >
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ approved, pending, rejected, total }: {
  approved: number; pending: number; rejected: number; total: number;
}) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const safe = total > 0 ? total : 1;
  const segs = [
    { count: approved, color: '#10b981', label: 'Approved' },
    { count: pending,  color: '#f59e0b', label: 'Pending'  },
    { count: rejected, color: '#ef4444', label: 'Rejected' },
  ];
  let off = 0;
  const arcs = segs.map(s => {
    const dash = (s.count / safe) * circ;
    const arc = { ...s, dash, off };
    off += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          {total === 0
            ? <circle cx={60} cy={60} r={r} fill="none" stroke="#f3f4f6" strokeWidth="13" />
            : arcs.map((arc, i) => arc.count > 0 && (
              <circle key={i} cx={60} cy={60} r={r} fill="none" stroke={arc.color} strokeWidth="13"
                strokeDasharray={`${arc.dash} ${circ - arc.dash}`} strokeDashoffset={-arc.off}
                strokeLinecap="butt" className="transition-all duration-500" />
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-[10px] text-gray-400">total</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {segs.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-gray-500">{s.label}</span>
            <span className="text-sm font-bold text-gray-900 ml-auto pl-2">
              {total > 0 ? Math.round((s.count / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#c0283c' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const w = 72, h = 26;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ');
  const lastY = h - (data[data.length - 1] / max) * (h - 4);
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

// ── Time Range Selector ────────────────────────────────────────────────────────
function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  const opts: { label: string; value: TimeRange }[] = [
    { label: '24h', value: '24h' },
    { label: '7d',  value: '7d'  },
    { label: '30d', value: '30d' },
    { label: 'All', value: 'all' },
  ];
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
      {opts.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
            value === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { employee, loading: authLoading } = useAuth();
  const [stats, setStats]       = useState<DashboardStats | null>(null);
  const [visits, setVisits]     = useState<Visit[]>([]);
  const [loading, setLoading]   = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  useEffect(() => {
    if (authLoading || !employee) return;
    visitApi.myVisits(undefined, false, undefined)
      .then(r => setVisits(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, employee]);

  const fetchStats = useCallback(async (range: TimeRange) => {
    setStatsLoading(true);
    try {
      const { data } = await visitApi.stats(range);
      setStats(data);
    } catch {}
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading || !employee) return;
    fetchStats(timeRange);
  }, [authLoading, employee, timeRange, fetchStats]);

  const recentVisits = useMemo(() => visits.slice(0, 5), [visits]);
  const chartData    = useMemo(() => buildChartData(visits, timeRange), [visits, timeRange]);

  // Filter visits for current range for donut
  const rangeVisits = useMemo(() => {
    const cur = nowIST();
    const MS: Record<TimeRange, number | null> = {
      '24h': 86400000, '7d': 604800000, '30d': 2592000000, 'all': null,
    };
    const ms = MS[timeRange];
    if (!ms) return visits;
    return visits.filter(v => {
      const visitUtcMs = new Date(
        v.created_at.endsWith('Z') ? v.created_at : v.created_at + '+05:30'
      ).getTime();
      return cur.utcMs - visitUtcMs <= ms;
    });
  }, [visits, timeRange]);

  const donutStats = useMemo(() => ({
    total:    rangeVisits.length,
    approved: rangeVisits.filter(v => ['approved','checked_in','checked_out'].includes(v.status)).length,
    pending:  rangeVisits.filter(v => v.status === 'pending').length,
    rejected: rangeVisits.filter(v => v.status === 'rejected').length,
  }), [rangeVisits]);

  // Sparkline: visits per day for last 7 days
  const sparklineData = useMemo(() => {
    const days = Array(7).fill(0);
    const cur  = nowIST();
    visits.forEach(v => {
      const visitUtcMs = new Date(
        v.created_at.endsWith('Z') ? v.created_at : v.created_at + '+05:30'
      ).getTime();
      const d = Math.floor((cur.utcMs - visitUtcMs) / 86400000);
      if (d >= 0 && d < 7) days[6 - d]++;
    });
    return days;
  }, [visits]);

  const rangeLabel: Record<TimeRange, string> = {
    '24h': 'Last 24 hours',
    '7d':  'Last 7 days',
    '30d': 'Last 30 days',
    'all': 'All time',
  };

  const statCards = [
    { label: 'Total Visits', value: stats?.total    ?? '—', icon: Users,        color: 'blue',    sparkColor: '#3b82f6' },
    { label: 'Pending',      value: stats?.pending  ?? '—', icon: Clock,        color: 'amber',   sparkColor: '#f59e0b' },
    { label: 'Approved',     value: stats?.approved ?? '—', icon: CheckCircle,  color: 'emerald', sparkColor: '#10b981' },
    { label: 'Rejected',     value: stats?.rejected ?? '—', icon: XCircle,      color: 'red',     sparkColor: '#ef4444' },
  ];

  const colorMap: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-600',
    amber:   'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red:     'bg-red-50 text-red-600',
  };

  return (
    <div className="animate-fade-in pb-8">

      {/* Header */}
      <div className="mb-5 lg:mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-gray-900">
              Good {getGreeting()}, {employee?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Here's what's happening with your visits.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">Showing:</span>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4 mb-5 lg:mb-6">
        {statCards.map(({ label, value, icon: Icon, color, sparkColor }) => (
          <div key={label} className="stat-card animate-slide-up">
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              {!loading && <Sparkline data={sparklineData} color={sparkColor} />}
            </div>
            <div className="mt-2 lg:mt-3">
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 font-display">
                {(loading || statsLoading)
                  ? <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse" />
                  : value}
              </p>
              <p className="text-xs lg:text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Range label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400 font-medium px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
          {rangeLabel[timeRange]} · {donutStats.total} visits · IST
        </span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-4 lg:mb-6">

        {/* Bar chart */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <h2 className="font-display font-bold text-gray-900 text-base lg:text-lg">Visit Activity</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400" />Approved</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" />Pending</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400" />Rejected</span>
            </div>
          </div>
          {loading ? (
            <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <BarChart data={chartData} range={timeRange} />
          )}
        </div>

        {/* Donut */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-gray-400" />
            <h2 className="font-display font-bold text-gray-900 text-base lg:text-lg">Distribution</h2>
          </div>
          {loading ? (
            <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <>
              <DonutChart
                approved={donutStats.approved}
                pending={donutStats.pending}
                rejected={donutStats.rejected}
                total={donutStats.total}
              />
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base lg:text-lg font-bold text-emerald-600">{donutStats.approved}</p>
                  <p className="text-[10px] text-gray-400">Approved</p>
                </div>
                <div>
                  <p className="text-base lg:text-lg font-bold text-amber-500">{donutStats.pending}</p>
                  <p className="text-[10px] text-gray-400">Pending</p>
                </div>
                <div>
                  <p className="text-base lg:text-lg font-bold text-red-500">{donutStats.rejected}</p>
                  <p className="text-[10px] text-gray-400">Rejected</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">{rangeLabel[timeRange]} · IST</p>
            </>
          )}
        </div>
      </div>

      {/* Recent visits + quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">

        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4 lg:mb-5">
            <h2 className="font-display font-bold text-gray-900 text-base lg:text-lg">Recent Visits</h2>
            <Link href="/dashboard/visits"
              className="text-xs text-crimson-600 font-semibold hover:text-crimson-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2 lg:space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 lg:h-16 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : recentVisits.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No visits yet</p>
            </div>
          ) : (
            <div className="space-y-1 lg:space-y-2">
              {recentVisits.map(v => (
                <div key={v.visit_id}
                  className="flex items-center gap-3 lg:gap-4 p-2.5 lg:p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  {v.visitor_thumbnail ? (
                    <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`} alt={v.visitor_name}
                      className="w-9 h-9 lg:w-10 lg:h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-crimson-100 flex items-center justify-center flex-shrink-0 text-crimson-600 font-bold text-sm">
                      {v.visitor_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.visitor_name}</p>
                    <p className="text-xs text-gray-400 truncate">{v.purpose || 'No purpose stated'}</p>
                  </div>
                  <div className="flex-shrink-0"><StatusBadge status={v.status} /></div>
                  <p className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">{fmtDate(v.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-gray-900 text-base lg:text-lg mb-4 lg:mb-5">Quick Actions</h2>
          <div className="flex flex-col gap-2 lg:gap-2.5">
            <Link href="/dashboard/notifications"
              className="flex items-center gap-3 p-3 lg:p-3.5 rounded-xl border border-crimson-100 bg-crimson-50 hover:bg-crimson-100 transition-colors group">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-crimson-600" />
              <div><p className="text-sm font-semibold text-crimson-800">Pending Approvals</p><p className="text-xs text-crimson-500">Review &amp; approve visits</p></div>
              <ArrowRight className="w-4 h-4 text-crimson-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/dashboard/search"
              className="flex items-center gap-3 p-3 lg:p-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group">
              <Users className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
              <div><p className="text-sm font-semibold text-gray-700">Search Visitor</p><p className="text-xs text-gray-400">Find by face or name</p></div>
              <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/dashboard/visits"
              className="flex items-center gap-3 p-3 lg:p-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group">
              <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
              <div><p className="text-sm font-semibold text-gray-700">Visit History</p><p className="text-xs text-gray-400">All visits &amp; records</p></div>
              <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="mt-4 lg:mt-6 pt-4 lg:pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 lg:mb-3">Your Profile</p>
            <div className="space-y-1.5 lg:space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Employee ID</span>
                <span className="font-mono font-semibold text-gray-900">{employee?.employee_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Department</span>
                <span className="font-semibold text-gray-900">{employee?.department || '—'}</span>
              </div>
            </div>
          </div>

          {!loading && stats && stats.total > 0 && (
            <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-gray-100">
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-2.5 lg:p-3">
                <TrendingUp className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                <p>
                  {stats.approved > stats.pending
                    ? `${stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% approval rate — great responsiveness!`
                    : `${stats.pending} visit${stats.pending !== 1 ? 's' : ''} still pending.`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}