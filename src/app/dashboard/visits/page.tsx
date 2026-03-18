'use client';
import { useEffect, useState, useMemo } from 'react';
import { RefreshCw, Users, X, Clock, MapPin, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { visitApi } from '@/lib/api';
import { Visit } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

const TABS = [
  { label: 'All',        value: ''           },
  { label: 'Pending',    value: 'pending'    },
  { label: 'Approved',   value: 'approved'   },
  { label: 'Rejected',   value: 'rejected'   },
  { label: 'Checked In', value: 'checked_in' },
];

/* ── Centered visitor detail modal ──────────────────────────────────────── */
function VisitorModal({ name, records, onClose }: { name: string; records: Visit[]; onClose: () => void }) {
  const thumbnail    = records[0]?.visitor_thumbnail;
  const email        = records[0]?.visitor_email;
  const phone        = records[0]?.visitor_phone;
  const approvedCnt  = records.filter(v => ['approved','checked_in','checked_out'].includes(v.status)).length;

  const timeSpentMap = useMemo(() => {
    const m: Record<string,string> = {};
    records.forEach(v => {
      if (v.status === 'checked_out' && v.updated_at && v.created_at) {
        const mins = Math.round((new Date(v.updated_at).getTime() - new Date(v.created_at).getTime()) / 60000);
        if (mins > 0) m[v.visit_id] = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;
      }
    });
    return m;
  }, [records]);

  const lastStay = Object.values(timeSpentMap).slice(-1)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-slide-up overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 80px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {thumbnail
              ? <img src={`data:image/jpeg;base64,${thumbnail}`} className="w-16 h-16 rounded-2xl object-cover border border-gray-200 flex-shrink-0" alt="" />
              : <div className="w-16 h-16 rounded-2xl bg-crimson-100 flex items-center justify-center text-crimson-600 text-2xl font-bold flex-shrink-0">{name.charAt(0)}</div>
            }
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg leading-tight">{name}</h2>
              {email && <p className="text-xs text-gray-400 mt-0.5">{email}</p>}
              {phone && <p className="text-xs text-gray-400">{phone}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{records.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Total visits</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{approvedCnt}</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">Approved</p>
            </div>
            {lastStay && (
              <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-base font-bold text-blue-700">{lastStay}</p>
                <p className="text-[10px] text-blue-400 mt-0.5">Last stay</p>
              </div>
            )}
          </div>
        </div>
        {/* Records */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">All Visit Records</p>
          {records.map((v, i) => {
            const dur = timeSpentMap[v.visit_id];
            return (
              <div key={v.visit_id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-gray-200 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <StatusBadge status={v.status} />
                  <span className="text-[10px] text-gray-400 font-mono">#{i+1}</span>
                </div>
                {v.purpose && <p className="text-xs text-gray-600 mb-1.5">🏷 {v.purpose}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(v.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'})}
                  </span>
                  {v.location_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.location_name}</span>}
                  {dur && <span className="flex items-center gap-1 text-blue-500 font-semibold"><Clock className="w-3 h-3" />{dur}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function VisitsPage() {
  const [visits, setVisits]       = useState<Visit[]>([]);
  const [tab, setTab]             = useState('');
  const [loading, setLoading]     = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [selected, setSelected]   = useState<{name:string;records:Visit[]}|null>(null);
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());

  const load = async (status: string) => {
    setLoading(true);
    try { const {data} = await visitApi.myVisits(status||undefined); setVisits(data); }
    catch { toast.error('Failed to load visits'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(tab); }, [tab]);

  const dateFiltered = useMemo(() => {
    if (!startDate && !endDate) return visits;
    const s = startDate ? new Date(startDate).getTime() : 0;
    const e = endDate   ? new Date(endDate).getTime()+86400000 : Infinity;
    return visits.filter(v => { const t=new Date(v.created_at).getTime(); return t>=s&&t<=e; });
  }, [visits,startDate,endDate]);

  const grouped = useMemo(() => {
    const map = new Map<string,Visit[]>();
    dateFiltered.forEach(v => {
      const k = v.visitor_name.trim().toLowerCase();
      if (!map.has(k)) map.set(k,[]);
      map.get(k)!.push(v);
    });
    return Array.from(map.values()).sort((a,b) =>
      Math.max(...b.map(r=>new Date(r.created_at).getTime())) -
      Math.max(...a.map(r=>new Date(r.created_at).getTime()))
    );
  }, [dateFiltered]);

  const toggleExpand = (name:string) =>
    setExpanded(prev => { const n=new Set(prev); n.has(name)?n.delete(name):n.add(name); return n; });

  return (
    <div className="animate-fade-in">
      {selected && <VisitorModal name={selected.name} records={selected.records} onClose={()=>setSelected(null)} />}

      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Visit Records</h1>
          <p className="text-xs text-gray-500 mt-0.5">{grouped.length} visitor{grouped.length!==1?'s':''}, {dateFiltered.length} total visits</p>
        </div>
        <button onClick={()=>load(tab)} className="btn-secondary"><RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Refresh</span></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-3 overflow-x-auto max-w-full">
        {TABS.map(t => (
          <button key={t.value} onClick={()=>setTab(t.value)}
            className={`px-3 lg:px-4 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${tab===t.value?'bg-white text-crimson-700 shadow-sm font-semibold':'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-crimson-500" />Date range:
        </span>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-crimson-300" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-crimson-300" />
        {(startDate||endDate) && (
          <>
            <button onClick={()=>{setStartDate('');setEndDate('');}} className="flex items-center gap-1 text-xs text-crimson-600 hover:text-crimson-700 font-medium">
              <X className="w-3 h-3" />Clear
            </button>
            <span className="text-[11px] text-gray-400">{dateFiltered.length} result{dateFiltered.length!==1?'s':''}</span>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_,i)=><div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse"/>)}</div>
      ) : grouped.length===0 ? (
        <div className="card text-center py-12">
          <Users className="w-10 h-10 mx-auto text-gray-200 mb-2" />
          <p className="text-gray-500 font-medium text-sm">No visits found</p>
          <p className="text-xs text-gray-400 mt-1">{tab?`No ${tab} visits`:'No visits match the selected filters'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map(records => {
            const name       = records[0].visitor_name;
            const thumbnail  = records[0].visitor_thumbnail;
            const latest     = records[0];
            const isExpanded = expanded.has(name);
            const statusCounts = records.reduce((acc,v)=>{acc[v.status]=(acc[v.status]||0)+1;return acc;},{} as Record<string,number>);
            return (
              <div key={name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-all">
                <div className="flex items-center gap-3 p-3 lg:p-4 cursor-pointer" onClick={()=>setSelected({name,records})}>
                  {thumbnail
                    ? <img src={`data:image/jpeg;base64,${thumbnail}`} className="w-11 h-11 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt="" />
                    : <div className="w-11 h-11 rounded-xl bg-crimson-100 flex items-center justify-center text-crimson-600 font-bold text-base flex-shrink-0">{name.charAt(0)}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{name}</p>
                      {records.length>1 && <span className="text-[10px] bg-crimson-50 text-crimson-600 border border-crimson-100 px-1.5 py-0.5 rounded-full font-semibold">{records.length} visits</span>}
                      <StatusBadge status={latest.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{latest.visitor_email}</p>
                      <p className="text-[11px] text-gray-400 flex-shrink-0">{new Date(latest.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</p>
                    </div>
                    {records.length>1 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(statusCounts).map(([s,c])=>(
                          <span key={s} className="text-[9px] bg-gray-50 border border-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">{c}× {s.replace('_',' ')}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {records.length>1 && (
                    <button onClick={e=>{e.stopPropagation();toggleExpand(name);}}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors">
                      {isExpanded?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
                    </button>
                  )}
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50 bg-gray-50/50">
                    {records.map((v,i)=>(
                      <div key={v.visit_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white transition-colors cursor-pointer" onClick={()=>setSelected({name,records})}>
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={v.status} />
                            {v.purpose && <span className="text-[11px] text-gray-500 truncate">🏷 {v.purpose}</span>}
                          </div>
                          <div className="flex flex-wrap gap-x-3 mt-0.5 text-[10px] text-gray-400">
                            <span>{new Date(v.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
                            {v.location_name && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3"/>{v.location_name}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}