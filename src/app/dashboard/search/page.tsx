'use client';
import { useState, useRef } from 'react';
import { Search, Camera, Upload, X, Loader2 } from 'lucide-react';
import { visitApi, visitorApi } from '@/lib/api';
import { Visit } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

export default function SearchPage() {
  const [mode, setMode]             = useState<'text' | 'face'>('text');
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<Visit[]>([]);
  const [faceMatches, setFaceMatches] = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [faceBlob, setFaceBlob]     = useState<Blob | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const textSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const { data } = await visitApi.search(query.trim());
      setResults(data);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const faceSearch = async () => {
    if (!faceBlob) return;
    setLoading(true); setSearched(true);
    try {
      const fd = new FormData();
      fd.append('photo', faceBlob, 'query.jpg');
      fd.append('limit', '5');
      const { data } = await visitorApi.recognize(fd);
      setFaceMatches(data.all_results || []);
      if (data.matched?.length === 0) toast('No close match found', { icon: '🔍' });
      else toast.success(`Found ${data.matched.length} match(es)`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Face search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceFile = (file: File) => {
    setFaceBlob(file);
    setFacePreview(URL.createObjectURL(file));
    setFaceMatches([]);
    setSearched(false);
  };

  const clearFace = () => {
    setFaceBlob(null); setFacePreview(null);
    setFaceMatches([]); setSearched(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Search Visitors</h1>
        <p className="text-sm text-gray-500 mt-0.5">Find by name, email, phone — or search by face</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4">
        {[
          { id: 'text', label: 'Text Search', icon: Search },
          { id: 'face', label: 'Face Search', icon: Camera },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setMode(id as any); setResults([]); setFaceMatches([]); setSearched(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === id ? 'bg-white text-crimson-700 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* TEXT SEARCH */}
      {mode === 'text' && (
        <div>
          <form onSubmit={textSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Search by name, email, or phone…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>

          {loading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-white rounded-xl border animate-pulse" />
              ))}
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">No results for "{query}"</p>
              <p className="text-xs mt-1">Try a different name, email, or phone</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">{results.length} result(s) found</p>
              <div className="card p-0 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Visitor', 'Contact', 'Purpose', 'Status', 'Date'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.map((v) => (
                      <tr key={v.visit_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {v.visitor_thumbnail ? (
                              <img
                                src={`data:image/jpeg;base64,${v.visitor_thumbnail}`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                alt=""
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-crimson-100 text-crimson-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {v.visitor_name.charAt(0)}
                              </div>
                            )}
                            <span className="font-semibold text-sm text-gray-900 truncate max-w-[90px]">
                              {v.visitor_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{v.visitor_phone}</p>
                          <p className="text-xs text-gray-400">{v.visitor_email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px] truncate">
                          {v.purpose || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FACE SEARCH */}
      {mode === 'face' && (
        <div>
          <div className="card max-w-md mb-4">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Upload a photo to search by face</h2>

            {!facePreview ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-crimson-300 hover:bg-crimson-50 transition-all group"
              >
                <Upload className="w-7 h-7 text-gray-300 group-hover:text-crimson-400 mx-auto mb-2 transition-colors" />
                <p className="text-sm text-gray-500">Click to upload a photo</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG — clear face required</p>
              </div>
            ) : (
              <div className="relative">
                <img src={facePreview} alt="Query" className="w-full h-44 object-cover rounded-xl" />
                <button
                  onClick={clearFace}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}
            <input
              ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFaceFile(f); }}
            />

            {faceBlob && (
              <button onClick={faceSearch} disabled={loading} className="btn-primary w-full justify-center mt-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {loading ? 'Searching…' : 'Search by Face'}
              </button>
            )}
          </div>

          {!loading && searched && faceMatches.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">No faces found</p>
            </div>
          )}

          {faceMatches.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">{faceMatches.length} candidate(s) — lower distance = better match</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {faceMatches.map((m, i) => (
                  <div
                    key={m.visitor_uid}
                    className={`card animate-slide-up ${m.is_match ? 'border-emerald-200' : 'opacity-60'}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {m.thumbnail ? (
                        <img src={`data:image/jpeg;base64,${m.thumbnail}`} className="w-12 h-12 rounded-xl object-cover" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-crimson-100 flex items-center justify-center text-crimson-600 text-lg font-bold">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{m.visitor_uid.slice(0, 8)}…</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>📞 {m.phone}</p>
                      <p>✉ {m.email}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg ${
                        m.is_match ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
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
        </div>
      )}
    </div>
  );
}
