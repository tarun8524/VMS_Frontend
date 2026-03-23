'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Camera, Upload, X, Loader2, ChevronLeft,
  ChevronRight, Users, BarChart3, ShieldCheck, CheckCircle, ArrowRight,
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

// ── Floating image upload modal ────────────────────────────────────────────────
function UploadImageModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (blob: Blob, preview: string) => void;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob]       = useState<Blob | null>(null);
  const fileRef               = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setBlob(file);
    setPreview(URL.createObjectURL(file));
  };

  const confirm = () => {
    if (blob && preview) { onConfirm(blob, preview); onClose(); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-crimson-100 flex items-center justify-center">
              <Camera className="w-4 h-4 text-crimson-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Upload Photo</p>
              <p className="text-[10px] text-gray-400">Used for face recognition search</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {!preview ? (
            /* Simple upload trigger — no drop zone */
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Upload className="w-7 h-7 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Select a photo from your device</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — clear face required</p>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800
                           text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Choose Photo
              </button>
            </div>
          ) : (
            /* Preview — full uncropped image */
            <div className="relative rounded-2xl overflow-hidden bg-gray-950 border border-gray-200">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-72 object-contain block"
                style={{ background: '#0f172a' }}
              />
              {/* Re-upload overlay button */}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                           bg-black/60 hover:bg-black/80 text-white text-xs font-semibold
                           backdrop-blur-sm transition-colors"
              >
                <Upload className="w-3 h-3" />
                Change
              </button>
              {/* Ready badge */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1
                              rounded-lg bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Photo ready
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!blob}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Use Photo
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const [page, setPage]         = useState(1);
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

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/30">
              {['Visitor', 'Contact', 'Total Visits', 'Rejected', 'Last Visit'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.map(v => (
              <tr key={v.visitor_uid} onClick={() => onSelect(v)}
                className="hover:bg-gray-50 transition-colors cursor-pointer group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {v.thumbnail
                      ? <img src={`data:image/jpeg;base64,${v.thumbnail}`} className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" alt="" />
                      : <div className="w-9 h-9 rounded-full bg-crimson-100 text-crimson-600 font-bold text-sm flex items-center justify-center flex-shrink-0">{v.name.charAt(0)}</div>
                    }
                    <span className="font-semibold text-gray-900 group-hover:text-crimson-700 transition-colors truncate max-w-[140px]">{v.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">{v.phone}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[160px]">{v.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-sm">{v.total_visits}</span>
                </td>
                <td className="px-4 py-3">
                  {v.rejected_visits > 0
                    ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 font-bold text-sm">{v.rejected_visits}</span>
                    : <span className="text-gray-300 text-sm">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {v.last_visit ? fmtDate(v.last_visit) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-gray-50">
        {paged.map(v => (
          <div key={v.visitor_uid} onClick={() => onSelect(v)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
            {v.thumbnail
              ? <img src={`data:image/jpeg;base64,${v.thumbnail}`} className="w-11 h-11 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt="" />
              : <div className="w-11 h-11 rounded-xl bg-crimson-100 text-crimson-600 font-bold text-base flex items-center justify-center flex-shrink-0">{v.name.charAt(0)}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{v.name}</p>
              <p className="text-xs text-gray-500">{v.phone}</p>
              <p className="text-xs text-gray-400 truncate">{v.email}</p>
            </div>
            <div className="text-right flex-shrink-0 space-y-1">
              <p className="text-xs font-semibold text-blue-600">{v.total_visits} visits</p>
              {v.rejected_visits > 0 && <p className="text-xs text-red-500">{v.rejected_visits} rejected</p>}
              {v.last_visit && <p className="text-[10px] text-gray-400">{fmtDate(v.last_visit)}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 border-t border-gray-50 pt-3">
        <Pagination total={visitors.length} page={page} pageSize={pageSize}
          onPage={setPage} onPageSize={s => setPageSize(s as any)} />
      </div>
    </div>
  );
}

// ── Visitor Visit History Panel ────────────────────────────────────────────────
function VisitorVisitsPanel({ visitor, onClose }: { visitor: VisitorWithStats; onClose: () => void }) {
  const [records, setRecords]   = useState<Visit[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(10);

  useEffect(() => {
    setLoading(true);
    visitApi.visitorRecords(visitor.visitor_uid)
      .then(r => setRecords(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [visitor.visitor_uid]);

  const paged = records.slice((page - 1) * pageSize, page * pageSize);

  // ── Compute real counts from fetched records ───────────────────────────────
  const totalVisits    = records.length;
  const rejectedVisits = records.filter(r => r.status === 'rejected').length;
  const approvedVisits = records.filter(r =>
    ['approved', 'checked_in', 'checked_out'].includes(r.status)
  ).length;

  // Skeleton pill shown while loading
  const StatSkeleton = () => (
    <div className="w-8 h-7 bg-gray-200 rounded-lg animate-pulse mx-auto" />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col animate-slide-up overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 80px)' }} onClick={e => e.stopPropagation()}>

        <div className="flex-shrink-0 p-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {visitor.thumbnail
              ? <img src={`data:image/jpeg;base64,${visitor.thumbnail}`} className="w-14 h-14 rounded-2xl object-cover border border-gray-200 flex-shrink-0" alt="" />
              : <div className="w-14 h-14 rounded-2xl bg-crimson-100 flex items-center justify-center text-crimson-600 text-xl font-bold flex-shrink-0">{visitor.name.charAt(0)}</div>
            }
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg">{visitor.name}</h2>
              <p className="text-xs text-gray-400">{visitor.email}</p>
              <p className="text-xs text-gray-400">{visitor.phone}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Stats — derived from fetched records, not visitor prop */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              {loading ? <StatSkeleton /> : <p className="text-xl font-bold text-blue-700">{totalVisits}</p>}
              <p className="text-[10px] text-blue-400 mt-0.5">Total visits</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              {loading ? <StatSkeleton /> : <p className="text-xl font-bold text-emerald-700">{approvedVisits}</p>}
              <p className="text-[10px] text-emerald-500 mt-0.5">Approved</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-3 text-center border border-red-100">
              {loading ? <StatSkeleton /> : <p className="text-xl font-bold text-red-600">{rejectedVisits}</p>}
              <p className="text-[10px] text-red-400 mt-0.5">Rejected</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-crimson-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-400"><p className="text-sm">No visit records found</p></div>
          ) : (
            <>
              <div className="px-5 py-2 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Visit History ({records.length})</p>
              </div>
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
                        <td className="px-5 py-3 text-xs text-gray-400 font-mono">#{(page - 1) * pageSize + i + 1}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">{v.purpose || '—'}</td>
                        <td className="px-4 py-3 text-xs text-emerald-600">{v.location_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-gray-50">
                {paged.map((v, i) => (
                  <div key={v.visit_id} className="px-5 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-mono">#{(page - 1) * pageSize + i + 1}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString('en-IN')}</p>
                    {v.purpose && <p className="text-xs text-gray-600">🏷 {v.purpose}</p>}
                    {v.location_name && <p className="text-xs text-emerald-600">{v.location_name}</p>}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4 border-t border-gray-50 pt-3">
                <Pagination total={records.length} page={page} pageSize={pageSize}
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
function TextSearchResults({
  results, query, onSelect,
}: {
  results: Visit[];
  query: string;
  onSelect: (v: VisitorWithStats) => void;
}) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(10);
  const paged = results.slice((page - 1) * pageSize, page * pageSize);

  // Build a VisitorWithStats-like object from a Visit row for the panel
  const visitToVisitor = (v: Visit): VisitorWithStats => ({
    visitor_uid:     v.visitor_uid,
    name:            v.visitor_name,
    phone:           v.visitor_phone,
    email:           v.visitor_email,
    thumbnail:       v.visitor_thumbnail ?? undefined,
    total_visits:    0,
    rejected_visits: 0,
    last_visit:      undefined,
  });

  return (
    <div className="card p-0 overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
        <p className="text-xs text-gray-500 font-medium">
          {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
          <span className="font-semibold text-gray-700">"{query}"</span>
          <span className="ml-2 text-gray-400">· click a row to view full history</span>
        </p>
      </div>
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
              <tr key={v.visit_id}
                onClick={() => onSelect(visitToVisitor(v))}
                className="hover:bg-crimson-50 transition-colors cursor-pointer group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    {v.visitor_thumbnail
                      ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                      : <div className="w-8 h-8 rounded-full bg-crimson-100 text-crimson-600 font-bold text-xs flex items-center justify-center flex-shrink-0">{v.visitor_name.charAt(0)}</div>
                    }
                    <span className="font-semibold text-sm text-gray-900 group-hover:text-crimson-700 transition-colors truncate max-w-[120px]">
                      {v.visitor_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-700">{v.visitor_phone}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[150px]">{v.visitor_email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px] truncate">{v.purpose || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(v.created_at)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-crimson-400 flex-shrink-0 transition-colors" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-gray-50">
        {paged.map(v => (
          <div key={v.visit_id}
            onClick={() => onSelect(visitToVisitor(v))}
            className="flex items-start gap-3 p-3 hover:bg-crimson-50 transition-colors cursor-pointer group">
            {v.visitor_thumbnail
              ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
              : <div className="w-10 h-10 rounded-full bg-crimson-100 text-crimson-600 font-bold flex items-center justify-center flex-shrink-0">{v.visitor_name.charAt(0)}</div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-gray-900 group-hover:text-crimson-700 transition-colors">
                  {v.visitor_name}
                </p>
                <StatusBadge status={v.status} />
              </div>
              <p className="text-xs text-gray-500">{v.visitor_phone}</p>
              <p className="text-xs text-gray-400 truncate">{v.visitor_email}</p>
              {v.purpose && <p className="text-xs text-gray-400 mt-0.5">🏷 {v.purpose}</p>}
              <p className="text-[10px] text-gray-300 mt-1">{fmtDate(v.created_at)}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-crimson-400 flex-shrink-0 mt-1 transition-colors" />
          </div>
        ))}
      </div>
      <div className="px-5 pb-4 border-t border-gray-50 pt-3">
        <Pagination total={results.length} page={page} pageSize={pageSize}
          onPage={setPage} onPageSize={s => setPageSize(s as any)} />
      </div>
    </div>
  );
}

// ── Best match card ────────────────────────────────────────────────────────────
function FaceBestMatch({ match, onClick }: { match: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border-2 border-emerald-200 ring-2 ring-emerald-100 p-4 shadow-sm
                 animate-slide-up max-w-sm cursor-pointer hover:shadow-md hover:border-emerald-300
                 transition-all group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          {match.thumbnail
            ? <img src={`data:image/jpeg;base64,${match.thumbnail}`}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-emerald-200" alt="" />
            : <div className="w-16 h-16 rounded-2xl bg-crimson-100 flex items-center justify-center text-crimson-600 font-bold text-2xl flex-shrink-0">
                {match.name.charAt(0)}
              </div>
          }
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 text-base truncate group-hover:text-crimson-700 transition-colors">
            {match.name}
          </p>
          {/* <p className="text-[10px] text-gray-400 font-mono truncate">{match.visitor_uid.slice(0, 8)}…</p> */}
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            ✓ Match
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-crimson-500 flex-shrink-0 transition-colors" />
      </div>
      <div className="text-xs text-gray-500 space-y-1 mb-3 px-1">
        <p className="truncate">📞 {match.phone}</p>
        <p className="truncate">✉ {match.email}</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">
        {Math.round((1 - match.distance) * 100)}% confidence
        </span>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-2 group-hover:text-crimson-500 transition-colors">
        Click to view visit history →
      </p>
    </div>
  );
}

// ── Convert face match payload → VisitorWithStats shape for the panel ─────────
function faceMatchToVisitor(m: any): VisitorWithStats {
  return {
    visitor_uid:     m.visitor_uid,
    name:            m.name,
    phone:           m.phone,
    email:           m.email,
    thumbnail:       m.thumbnail ?? null,
    total_visits:    0,   // panel fetches real records anyway
    rejected_visits: 0,
    last_visit:      undefined,
  };
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [mode, setMode]                   = useState<'text' | 'face'>('text');
  const [query, setQuery]                 = useState('');
  const [searchResults, setSearchResults] = useState<Visit[]>([]);
  const [faceResult, setFaceResult]       = useState<{
    matched: any[]; all_results: any[];
    threshold: number; total_candidates: number; employee_candidates: number;
  } | null>(null);
  const [loading, setLoading]             = useState(false);
  const [searched, setSearched]           = useState(false);

  // Face photo state
  const [faceBlob, setFaceBlob]           = useState<Blob | null>(null);
  const [facePreview, setFacePreview]     = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Visitor directory
  const [visitors, setVisitors]               = useState<VisitorWithStats[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorWithStats | null>(null);
  // For face match / text search click-to-detail
  const [detailVisitor, setDetailVisitor]     = useState<VisitorWithStats | null>(null);

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
      const { data } = await visitorApi.recognizeForEmployee(fd);
      setFaceResult(data);
      if (!data.matched?.length) {
        toast(
          data.employee_candidates === 0
            ? 'This person has not visited you before'
            : 'Face did not meet the similarity threshold',
          { icon: '🔍' }
        );
      } else {
        toast.success(`Matched: ${data.matched[0].name}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Face search failed');
    } finally { setLoading(false); }
  };

  const handlePhotoConfirm = (blob: Blob, preview: string) => {
    setFaceBlob(blob);
    setFacePreview(preview);
    setFaceResult(null);
    setSearched(false);
  };

  const clearFace = () => {
    setFaceBlob(null);
    setFacePreview(null);
    setFaceResult(null);
    setSearched(false);
  };

  const filteredVisitors = query.trim()
    ? visitors.filter(v =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.email.toLowerCase().includes(query.toLowerCase()) ||
        v.phone.includes(query)
      )
    : visitors;

  return (
    <div className="animate-fade-in">
      {/* Upload modal */}
      {showUploadModal && (
        <UploadImageModal
          onConfirm={handlePhotoConfirm}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* Directory visitor detail panel */}
      {selectedVisitor && (
        <VisitorVisitsPanel visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} />
      )}

      {/* Face match / text search detail panel */}
      {detailVisitor && (
        <VisitorVisitsPanel visitor={detailVisitor} onClose={() => setDetailVisitor(null)} />
      )}

      <div className="mb-4">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Search Visitors</h1>
        <p className="text-xs text-gray-500 mt-0.5">Find by name, email, phone — or search by face</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4">
        {[{ id: 'text', label: 'Text Search', icon: Search }, { id: 'face', label: 'Face Search', icon: Camera }].map(({ id, label, icon: Icon }) => (
          <button key={id}
            onClick={() => { setMode(id as any); setSearchResults([]); setFaceResult(null); setSearched(false); setQuery(''); }}
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
              <p className="font-medium text-sm">No results for "{query}"</p>
            </div>
          )}

          {!loading && searched && searchResults.length > 0 && (
            <TextSearchResults
              results={searchResults}
              query={query}
              onSelect={setDetailVisitor}
            />
          )}

          {!loading && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">
                  {query ? `Directory — "${query}"` : 'Your Visitor Directory'}
                </h2>
                {visitorsLoading && <div className="w-4 h-4 border-2 border-crimson-400 border-t-transparent rounded-full animate-spin" />}
              </div>
              {visitorsLoading
                ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border animate-pulse" />)}</div>
                : <VisitorDirectoryTable visitors={filteredVisitors} onSelect={setSelectedVisitor} />
              }
            </div>
          )}
        </div>
      )}

      {/* ── FACE MODE ── */}
      {mode === 'face' && (
        <div className="space-y-4">

          {/* Upload card */}
          <div className="card max-w-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Search by Face</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Searches only among <span className="font-semibold text-gray-600">your visitors</span> — returns best match
                </p>
              </div>
              {/* Upload button — always visible */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800
                           text-white text-xs font-semibold transition-colors flex-shrink-0 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                {faceBlob ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>

            {/* Image preview — uncropped, full image — only shown after upload */}
            {facePreview && (
              <div className="relative rounded-2xl overflow-hidden bg-gray-950 border border-gray-200 mb-3">
                <img
                  src={facePreview}
                  alt="Face query"
                  className="w-full max-h-80 object-contain block"
                  style={{ background: '#0f172a' }}
                />
                <button
                  onClick={clearFace}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full
                             flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1
                                rounded-lg bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  Photo ready
                </div>
              </div>
            )}

            {/* Search button */}
            {faceBlob && (
              <button
                onClick={faceSearch}
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
                  : <><Camera className="w-4 h-4" /> Search by Face</>
                }
              </button>
            )}
          </div>

          {/* Results */}
          {!loading && searched && faceResult && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Searched <span className="font-semibold text-gray-600">{faceResult.employee_candidates}</span> of your visitors
                {faceResult.total_candidates > faceResult.employee_candidates && (
                  <span className="text-gray-300"> · {faceResult.total_candidates} global candidates filtered</span>
                )}
              </p>

              {faceResult.matched.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Best Match
                  </p>
                  <FaceBestMatch
                    match={faceResult.matched[0]}
                    onClick={() => setDetailVisitor(faceMatchToVisitor(faceResult.matched[0]))}
                  />
                </div>
              ) : (
                <div className="card text-center py-10 text-gray-400 max-w-md">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-sm">No match found</p>
                  <p className="text-xs mt-1">
                    {faceResult.employee_candidates === 0
                      ? 'This person has not visited you before.'
                      : 'Face did not meet the similarity threshold.'}
                  </p>
                </div>
              )}

              {faceResult.all_results.length > 1 && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                    Other candidates from your visitors ({faceResult.all_results.length - 1})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {faceResult.all_results.slice(1).map((m, i) => (
                      <div key={m.visitor_uid}
                        onClick={() => setDetailVisitor(faceMatchToVisitor(m))}
                        className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm opacity-60
                                   hover:opacity-100 hover:border-gray-300 hover:shadow-md
                                   animate-slide-up cursor-pointer transition-all group"
                        style={{ animationDelay: `${i * 0.04}s` }}>
                        <div className="flex items-center gap-2.5 mb-2">
                          {m.thumbnail
                            ? <img src={`data:image/jpeg;base64,${m.thumbnail}`} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
                            : <div className="w-10 h-10 rounded-xl bg-crimson-100 flex items-center justify-center text-crimson-600 font-bold flex-shrink-0">{m.name.charAt(0)}</div>
                          }
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-700 text-sm truncate group-hover:text-crimson-700 transition-colors">{m.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{m.phone}</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-crimson-400 flex-shrink-0 transition-colors" />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                          <span className="text-xs font-mono text-gray-400">dist: {m.distance}</span>
                          <span className="text-xs text-gray-400">No match</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && searched && !faceResult && (
            <div className="card text-center py-10 text-gray-400 max-w-md">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">No faces found</p>
            </div>
          )}

          {/* Directory — shown when no active search */}
          {!searched && !loading && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Visitor Directory</h2>
              {visitorsLoading
                ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border animate-pulse" />)}</div>
                : <VisitorDirectoryTable visitors={visitors} onSelect={setSelectedVisitor} />
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}