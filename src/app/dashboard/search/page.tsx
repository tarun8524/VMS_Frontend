'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Camera, Upload, X, Loader2, ChevronLeft,
  ChevronRight, ExternalLink, Users, BarChart3,
} from 'lucide-react';
import { visitApi, visitorApi } from '@/lib/api';
import { Visit, VisitorWithStats } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

const PAGE_SIZES = [10, 20, 50] as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: '2-digit',
  });
}

// ── Pagination ─────────────────────────────────────────────────────────────────
function Pagination({ total, page, pageSize, onPage, onPageSize }: {
  total: number; page: number; pageSize: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
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
        per page · <span className="font-medium text-gray-700">{total}</span> result{total !== 1 ? 's' : ''}
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

// ── Visitor directory table ────────────────────────────────────────────────────
function VisitorDirectoryTable({
  visitors,
  onSelect,
}: {
  visitors: VisitorWithStats[];
  onSelect: (v: VisitorWithStats) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(10);
  const paged = visitors.slice((page - 1) * pageSize, page * pageSize);

  if (visitors.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No visitors yet</p>
        <p className="text-xs mt-1">Visitors who request to see you will appear here</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-gray-400" />
        <p className="text-sm font-semibold text-gray-700">
          Your Visitors <span className="text-gray-400 font-normal">({visitors.length})</span>
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/30">
              {['Visitor', 'Contact', 'Total Visits', 'Rejected', 'Last Visit'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.map(v => (
              <tr key={v.visitor_uid}
                onClick={() => onSelect(v)}
                className="hover:bg-gray-50 transition-colors cursor-pointer group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {v.thumbnail
                      ? <img src={`data:image/jpeg;base64,${v.thumbnail}`}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" alt="" />
                      : <div className="w-9 h-9 rounded-full bg-crimson-100 text-crimson-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {v.name.charAt(0)}
                        </div>
                    }
                    <span className="font-semibold text-gray-900 group-hover:text-crimson-700 transition-colors truncate max-w-[140px]">
                      {v.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">{v.phone}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[160px]">{v.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-sm">
                    {v.total_visits}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {v.rejected_visits > 0
                    ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 font-bold text-sm">
                        {v.rejected_visits}
                      </span>
                    : <span className="text-gray-300 text-sm">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {v.last_visit ? fmtDate(v.last_visit) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {paged.map(v => (
          <div key={v.visitor_uid}
            onClick={() => onSelect(v)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
            {v.thumbnail
              ? <img src={`data:image/jpeg;base64,${v.thumbnail}`}
                  className="w-11 h-11 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt="" />
              : <div className="w-11 h-11 rounded-xl bg-crimson-100 text-crimson-600 font-bold text-base flex items-center justify-center flex-shrink-0">
                  {v.name.charAt(0)}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{v.name}</p>
              <p className="text-xs text-gray-500">{v.phone}</p>
              <p className="text-xs text-gray-400 truncate">{v.email}</p>
            </div>
            <div className="text-right flex-shrink-0 space-y-1">
              <p className="text-xs font-semibold text-blue-600">{v.total_visits} visits</p>
              {v.rejected_visits > 0 && (
                <p className="text-xs text-red-500">{v.rejected_visits} rejected</p>
              )}
              {v.last_visit && (
                <p className="text-[10px] text-gray-400">{fmtDate(v.last_visit)}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 border-t border-gray-50 pt-3">
        <Pagination
          total={visitors.length} page={page} pageSize={pageSize}
          onPage={setPage} onPageSize={s => setPageSize(s as any)} />
      </div>
    </div>
  );
}

// ── Visitor Visit History Panel ────────────────────────────────────────────────
function VisitorVisitsPanel({
  visitor,
  onClose,
}: {
  visitor: VisitorWithStats;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(10);

  useEffect(() => {
    setLoading(true);
    visitApi.visitorRecords(visitor.visitor_uid)
      .then(r => setRecords(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [visitor.visitor_uid]);

  const paged = records.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col animate-slide-up overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 80px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {visitor.thumbnail
              ? <img src={`data:image/jpeg;base64,${visitor.thumbnail}`}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-200 flex-shrink-0" alt="" />
              : <div className="w-14 h-14 rounded-2xl bg-crimson-100 flex items-center justify-center text-crimson-600 text-xl font-bold flex-shrink-0">
                  {visitor.name.charAt(0)}
                </div>
            }
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg">{visitor.name}</h2>
              <p className="text-xs text-gray-400">{visitor.email}</p>
              <p className="text-xs text-gray-400">{visitor.phone}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <p className="text-xl font-bold text-blue-700">{visitor.total_visits}</p>
              <p className="text-[10px] text-blue-400 mt-0.5">Total visits</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-xl font-bold text-emerald-700">{visitor.total_visits - visitor.rejected_visits}</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">Approved</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-3 text-center border border-red-100">
              <p className="text-xl font-bold text-red-600">{visitor.rejected_visits}</p>
              <p className="text-[10px] text-red-400 mt-0.5">Rejected</p>
            </div>
          </div>
        </div>

        {/* Records table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-crimson-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No visit records found</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-2 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  Visit History ({records.length})
                </p>
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['#', 'Date', 'Status', 'Purpose', 'Location'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paged.map((v, i) => (
                      <tr key={v.visit_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-xs text-gray-400 font-mono">
                          #{(page - 1) * pageSize + i + 1}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {new Date(v.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">{v.purpose || '—'}</td>
                        <td className="px-4 py-3 text-xs text-emerald-600">{v.location_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-50">
                {paged.map((v, i) => (
                  <div key={v.visit_id} className="px-5 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-mono">#{(page - 1) * pageSize + i + 1}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(v.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {v.purpose && <p className="text-xs text-gray-600">🏷 {v.purpose}</p>}
                    {v.location_name && <p className="text-xs text-emerald-600">{v.location_name}</p>}
                  </div>
                ))}
              </div>

              <div className="px-5 pb-4 border-t border-gray-50 pt-3">
                <Pagination
                  total={records.length} page={page} pageSize={pageSize}
                  onPage={setPage} onPageSize={s => setPageSize(s as any)} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Text Search Results ────────────────────────────────────────────────────────
function TextSearchResults({ results, query }: { results: Visit[]; query: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(10);
  const paged = results.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card p-0 overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
        <p className="text-xs text-gray-500 font-medium">
          {results.length} result{results.length !== 1 ? 's' : ''} for <span className="font-semibold text-gray-700">"{query}"</span>
        </p>
      </div>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              {['Visitor', 'Contact', 'Purpose', 'Status', 'Date'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.map(v => (
              <tr key={v.visit_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    {v.visitor_thumbnail
                      ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                      : <div className="w-8 h-8 rounded-full bg-crimson-100 text-crimson-600 font-bold text-xs flex items-center justify-center flex-shrink-0">{v.visitor_name.charAt(0)}</div>
                    }
                    <span className="font-semibold text-sm text-gray-900 truncate max-w-[120px]">{v.visitor_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-700">{v.visitor_phone}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[150px]">{v.visitor_email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px] truncate">{v.purpose || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(v.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-gray-50">
        {paged.map(v => (
          <div key={v.visit_id} className="flex items-start gap-3 p-3">
            {v.visitor_thumbnail
              ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
              : <div className="w-10 h-10 rounded-full bg-crimson-100 text-crimson-600 font-bold flex items-center justify-center flex-shrink-0">{v.visitor_name.charAt(0)}</div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-gray-900">{v.visitor_name}</p>
                <StatusBadge status={v.status} />
              </div>
              <p className="text-xs text-gray-500">{v.visitor_phone}</p>
              <p className="text-xs text-gray-400 truncate">{v.visitor_email}</p>
              {v.purpose && <p className="text-xs text-gray-400 mt-0.5">🏷 {v.purpose}</p>}
              <p className="text-[10px] text-gray-300 mt-1">{fmtDate(v.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 border-t border-gray-50 pt-3">
        <Pagination
          total={results.length} page={page} pageSize={pageSize}
          onPage={setPage} onPageSize={s => setPageSize(s as any)} />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [mode, setMode]                   = useState<'text' | 'face'>('text');
  const [query, setQuery]                 = useState('');
  const [searchResults, setSearchResults] = useState<Visit[]>([]);
  const [faceMatches, setFaceMatches]     = useState<any[]>([]);
  const [loading, setLoading]             = useState(false);
  const [searched, setSearched]           = useState(false);
  const [faceBlob, setFaceBlob]           = useState<Blob | null>(null);
  const [facePreview, setFacePreview]     = useState<string | null>(null);

  // Visitor directory
  const [visitors, setVisitors]           = useState<VisitorWithStats[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorWithStats | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // Load visitor directory on mount
  useEffect(() => {
    visitorApi.myVisitors()
      .then(r => setVisitors(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setVisitorsLoading(false));
  }, []);

  const textSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const { data } = await visitApi.search(query.trim());
      setSearchResults(data);
      if (!data.length) toast('No results found', { icon: '🔍' });
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  const faceSearch = async () => {
    if (!faceBlob) return;
    setLoading(true); setSearched(true);
    try {
      const fd = new FormData();
      fd.append('photo', faceBlob, 'query.jpg');
      fd.append('limit', '20');
      const { data } = await visitorApi.recognize(fd);
      setFaceMatches(data.all_results || []);
      if (!data.matched?.length) toast('No close match found', { icon: '🔍' });
      else toast.success(`Found ${data.matched.length} match(es)`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Face search failed');
    } finally { setLoading(false); }
  };

  const handleFaceFile = (file: File) => {
    setFaceBlob(file); setFacePreview(URL.createObjectURL(file));
    setFaceMatches([]); setSearched(false);
  };
  const clearFace = () => { setFaceBlob(null); setFacePreview(null); setFaceMatches([]); setSearched(false); };

  // Filter directory by search query
  const filteredVisitors = query.trim()
    ? visitors.filter(v =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.email.toLowerCase().includes(query.toLowerCase()) ||
        v.phone.includes(query)
      )
    : visitors;

  return (
    <div className="animate-fade-in">
      {selectedVisitor && (
        <VisitorVisitsPanel
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
        />
      )}

      <div className="mb-4">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Search Visitors</h1>
        <p className="text-xs text-gray-500 mt-0.5">Find by name, email, phone — or search by face</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4">
        {[{ id: 'text', label: 'Text Search', icon: Search }, { id: 'face', label: 'Face Search', icon: Camera }].map(({ id, label, icon: Icon }) => (
          <button key={id}
            onClick={() => { setMode(id as any); setSearchResults([]); setFaceMatches([]); setSearched(false); setQuery(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === id ? 'bg-white text-crimson-700 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── TEXT MODE ── */}
      {mode === 'text' && (
        <div className="space-y-4">
          <form onSubmit={textSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-9" placeholder="Search by name, email, or phone…"
                value={query} onChange={e => { setQuery(e.target.value); if (!e.target.value) setSearched(false); }}
                autoFocus />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>

          {loading && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border animate-pulse" />)}
            </div>
          )}

          {!loading && searched && searchResults.length === 0 && (
            <div className="card text-center py-10 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">No visit results for "{query}"</p>
            </div>
          )}

          {!loading && searched && searchResults.length > 0 && (
            <TextSearchResults results={searchResults} query={query} />
          )}

          {/* Visitor directory — always shown, filtered by query if present */}
          {!loading && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">
                  {query ? `Directory — "${query}"` : 'Your Visitor Directory'}
                </h2>
                {visitorsLoading && (
                  <div className="w-4 h-4 border-2 border-crimson-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              {visitorsLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border animate-pulse" />)}
                </div>
              ) : (
                <VisitorDirectoryTable
                  visitors={filteredVisitors}
                  onSelect={setSelectedVisitor}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FACE MODE ── */}
      {mode === 'face' && (
        <div className="space-y-4">
          <div className="card max-w-md">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Upload a photo to search by face</h2>
            {!facePreview ? (
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-crimson-300 hover:bg-crimson-50 transition-all group">
                <Upload className="w-7 h-7 text-gray-300 group-hover:text-crimson-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload a photo</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG — clear face required</p>
              </div>
            ) : (
              <div className="relative">
                <img src={facePreview} alt="Query" className="w-full h-44 object-cover rounded-xl" />
                <button onClick={clearFace}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors">
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFaceFile(f); }} />
            {faceBlob && (
              <button onClick={faceSearch} disabled={loading} className="btn-primary w-full justify-center mt-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {loading ? 'Searching…' : 'Search by Face'}
              </button>
            )}
          </div>

          {!loading && searched && faceMatches.length === 0 && (
            <div className="card text-center py-10 text-gray-400">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">No faces found</p>
            </div>
          )}

          {faceMatches.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                {faceMatches.filter(m => m.is_match).length} match{faceMatches.filter(m => m.is_match).length !== 1 ? 'es' : ''} · {faceMatches.length} candidate{faceMatches.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {faceMatches.map((m, i) => (
                  <div key={m.visitor_uid}
                    className={`bg-white rounded-xl border p-3 shadow-sm animate-slide-up transition-all ${m.is_match ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-gray-100 opacity-60'}`}
                    style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      {m.thumbnail
                        ? <img src={`data:image/jpeg;base64,${m.thumbnail}`} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" alt="" />
                        : <div className="w-11 h-11 rounded-xl bg-crimson-100 flex items-center justify-center text-crimson-600 font-bold text-base flex-shrink-0">{m.name.charAt(0)}</div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{m.visitor_uid.slice(0, 8)}…</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                      <p className="truncate">📞 {m.phone}</p>
                      <p className="truncate">✉ {m.email}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg ${m.is_match ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        dist: {m.distance}
                      </span>
                      {m.is_match
                        ? <span className="text-xs font-semibold text-emerald-600">✓ Match</span>
                        : <span className="text-xs text-gray-400">No match</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visitor directory below face search too */}
          {!searched && !loading && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Visitor Directory</h2>
              {visitorsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border animate-pulse" />)}
                </div>
              ) : (
                <VisitorDirectoryTable visitors={visitors} onSelect={setSelectedVisitor} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}