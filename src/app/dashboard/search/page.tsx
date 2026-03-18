'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, Camera, Upload, X, Loader2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { visitApi, visitorApi, employeeApi } from '@/lib/api';
import { Visit } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

const PAGE_SIZES = [10, 20, 50] as const;

/* ── Pagination ─────────────────────────────────────────────────────────── */
function Pagination({ total, page, pageSize, onPage, onPageSize }: {
  total:number; page:number; pageSize:number;
  onPage:(p:number)=>void; onPageSize:(s:number)=>void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        Show
        <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg">
          {PAGE_SIZES.map(s => (
            <button key={s} onClick={()=>{onPageSize(s);onPage(1);}}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${pageSize===s?'bg-white text-crimson-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
        per page · <span className="font-medium text-gray-700">{total}</span> result{total!==1?'s':''}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={()=>onPage(page-1)} disabled={page===1}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500"/>
          </button>
          {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
            let p:number;
            if(totalPages<=5) p=i+1;
            else if(page<=3) p=i+1;
            else if(page>=totalPages-2) p=totalPages-4+i;
            else p=page-2+i;
            return (
              <button key={p} onClick={()=>onPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${page===p?'bg-crimson-600 text-white':'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p}
              </button>
            );
          })}
          <button onClick={()=>onPage(page+1)} disabled={page===totalPages}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-gray-500"/>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Visitor row / card ─────────────────────────────────────────────────── */
function VisitRow({ v }: { v: Visit }) {
  return (
    <>
      {/* Desktop row */}
      <tr className="hidden lg:table-row hover:bg-gray-50 transition-colors">
        <td className="px-5 py-3">
          <div className="flex items-center gap-2.5">
            {v.visitor_thumbnail
              ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt=""/>
              : <div className="w-8 h-8 rounded-full bg-crimson-100 text-crimson-600 font-bold text-xs flex items-center justify-center flex-shrink-0">{v.visitor_name.charAt(0)}</div>
            }
            <span className="font-semibold text-sm text-gray-900 truncate max-w-[110px]">{v.visitor_name}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-gray-700">{v.visitor_phone}</p>
          <p className="text-xs text-gray-400">{v.visitor_email}</p>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 max-w-[130px] truncate">{v.purpose||'—'}</td>
        <td className="px-4 py-3"><StatusBadge status={v.status}/></td>
        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
          {new Date(v.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
        </td>
      </tr>
      {/* Mobile card */}
      <tr className="lg:hidden">
        <td colSpan={5} className="px-0 py-0.5">
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
            {v.visitor_thumbnail
              ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt=""/>
              : <div className="w-10 h-10 rounded-full bg-crimson-100 text-crimson-600 font-bold text-sm flex items-center justify-center flex-shrink-0">{v.visitor_name.charAt(0)}</div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-gray-900">{v.visitor_name}</p>
                <StatusBadge status={v.status}/>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{v.visitor_phone}</p>
              <p className="text-xs text-gray-400 truncate">{v.visitor_email}</p>
              {v.purpose&&<p className="text-xs text-gray-400 truncate mt-0.5">🏷 {v.purpose}</p>}
              <p className="text-[10px] text-gray-300 mt-1">
                {new Date(v.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
              </p>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

/* ── Recent visitors grid (shown before any search) ─────────────────────── */
function RecentVisitorsGrid({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) return null;
  // Deduplicate by name
  const seen = new Set<string>();
  const unique = visits.filter(v => {
    const k = v.visitor_name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 12);

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent Visitors</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
        {unique.map(v => (
          <div key={v.visit_id} className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-default">
            {v.visitor_thumbnail
              ? <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`} className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" alt=""/>
              : <div className="w-9 h-9 rounded-full bg-crimson-100 text-crimson-600 font-bold text-sm flex items-center justify-center flex-shrink-0">{v.visitor_name.charAt(0)}</div>
            }
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{v.visitor_name}</p>
              <StatusBadge status={v.status}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function SearchPage() {
  const [mode, setMode]               = useState<'text'|'face'>('text');
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<Visit[]>([]);
  const [faceMatches, setFaceMatches] = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);
  const [faceBlob, setFaceBlob]       = useState<Blob|null>(null);
  const [facePreview, setFacePreview] = useState<string|null>(null);
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState<typeof PAGE_SIZES[number]>(10);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load recent visits for the grid preview
  useEffect(() => {
    visitApi.myVisits().then(r => setRecentVisits(r.data || [])).catch(() => {});
  }, []);

  const textSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true); setPage(1);
    try {
      const { data } = await visitApi.search(query.trim());
      setResults(data);
      if (data.length === 0) toast('No results found', { icon: '🔍' });
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

  const pagedResults = results.slice((page-1)*pageSize, page*pageSize);

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Search Visitors</h1>
        <p className="text-xs text-gray-500 mt-0.5">Find by name, email, phone — or search by face</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4">
        {[{id:'text',label:'Text Search',icon:Search},{id:'face',label:'Face Search',icon:Camera}].map(({id,label,icon:Icon})=>(
          <button key={id}
            onClick={()=>{ setMode(id as any); setResults([]); setFaceMatches([]); setSearched(false); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode===id?'bg-white text-crimson-700 shadow-sm font-semibold':'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-3.5 h-3.5"/>{label}
          </button>
        ))}
      </div>

      {/* ── TEXT SEARCH ── */}
      {mode==='text' && (
        <div className="space-y-4">
          <form onSubmit={textSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input className="input pl-9" placeholder="Search by name, email, or phone…"
                value={query} onChange={e=>setQuery(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Search className="w-4 h-4"/>}
              Search
            </button>
          </form>

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-2">
              {[...Array(4)].map((_,i)=><div key={i} className="h-14 bg-white rounded-xl border animate-pulse"/>)}
            </div>
          )}

          {/* Empty state */}
          {!loading && searched && results.length===0 && (
            <div className="card text-center py-10 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30"/>
              <p className="font-medium text-sm">No results for "{query}"</p>
              <p className="text-xs mt-1">Try a different name, email, or phone number</p>
            </div>
          )}

          {/* Results */}
          {!loading && results.length>0 && (
            <div>
              {/* Desktop table */}
              <div className="hidden lg:block card p-0 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-500">
                    {results.length} result{results.length!==1?'s':''} found for "{query}"
                  </p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Visitor','Contact','Purpose','Status','Date'].map(h=>(
                        <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pagedResults.map(v => <VisitRow key={v.visit_id} v={v}/>)}
                  </tbody>
                </table>
                <div className="px-5 pb-4">
                  <Pagination total={results.length} page={page} pageSize={pageSize}
                    onPage={setPage} onPageSize={s=>setPageSize(s as any)}/>
                </div>
              </div>
              {/* Mobile */}
              <div className="lg:hidden space-y-1">
                <p className="text-xs text-gray-500 mb-2">{results.length} result{results.length!==1?'s':''}</p>
                <table className="w-full"><tbody>
                  {pagedResults.map(v=><VisitRow key={v.visit_id} v={v}/>)}
                </tbody></table>
                <Pagination total={results.length} page={page} pageSize={pageSize}
                  onPage={setPage} onPageSize={s=>setPageSize(s as any)}/>
              </div>
            </div>
          )}

          {/* Pre-search: show recent visitors */}
          {!searched && !loading && (
            <RecentVisitorsGrid visits={recentVisits} />
          )}
        </div>
      )}

      {/* ── FACE SEARCH ── */}
      {mode==='face' && (
        <div className="space-y-4">
          <div className="card max-w-md">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Upload a photo to search by face</h2>
            {!facePreview ? (
              <div onClick={()=>fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-crimson-300 hover:bg-crimson-50 transition-all group">
                <Upload className="w-7 h-7 text-gray-300 group-hover:text-crimson-400 mx-auto mb-2"/>
                <p className="text-sm text-gray-500">Click to upload a photo</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG — clear face required</p>
              </div>
            ) : (
              <div className="relative">
                <img src={facePreview} alt="Query" className="w-full h-44 object-cover rounded-xl"/>
                <button onClick={clearFace}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors">
                  <X className="w-3.5 h-3.5 text-gray-500"/>
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e=>{const f=e.target.files?.[0];if(f)handleFaceFile(f);}}/>
            {faceBlob && (
              <button onClick={faceSearch} disabled={loading} className="btn-primary w-full justify-center mt-3">
                {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Camera className="w-4 h-4"/>}
                {loading?'Searching…':'Search by Face'}
              </button>
            )}
          </div>

          {!loading && searched && faceMatches.length===0 && (
            <div className="card text-center py-10 text-gray-400">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-30"/>
              <p className="font-medium text-sm">No faces found</p>
              <p className="text-xs mt-1">Make sure the photo shows a clear, front-facing face</p>
            </div>
          )}

          {faceMatches.length>0 && (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                {faceMatches.filter(m=>m.is_match).length} match{faceMatches.filter(m=>m.is_match).length!==1?'es':''} found · {faceMatches.length} candidate{faceMatches.length!==1?'s':''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {faceMatches.map((m,i)=>(
                  <div key={m.visitor_uid}
                    className={`bg-white rounded-xl border p-3 shadow-sm animate-slide-up transition-all ${m.is_match?'border-emerald-200 ring-2 ring-emerald-100':'border-gray-100 opacity-60'}`}
                    style={{animationDelay:`${i*0.04}s`}}>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      {m.thumbnail
                        ? <img src={`data:image/jpeg;base64,${m.thumbnail}`} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" alt=""/>
                        : <div className="w-11 h-11 rounded-xl bg-crimson-100 flex items-center justify-center text-crimson-600 font-bold text-base flex-shrink-0">{m.name.charAt(0)}</div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{m.visitor_uid.slice(0,8)}…</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                      <p className="truncate">📞 {m.phone}</p>
                      <p className="truncate">✉ {m.email}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg ${m.is_match?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>
                        dist: {m.distance}
                      </span>
                      {m.is_match
                        ? <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px]">✓</span>Match</span>
                        : <span className="text-xs text-gray-400">No match</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pre-search: show recent visitors grid */}
          {!searched && !loading && (
            <RecentVisitorsGrid visits={recentVisits}/>
          )}
        </div>
      )}
    </div>
  );
}