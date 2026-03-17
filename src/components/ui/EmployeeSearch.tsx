'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, User } from 'lucide-react';
import { employeeApi } from '@/lib/api';

interface Props {
  value: string;
  onChange: (employeeId: string, name: string) => void;
  error?: string;
}

interface EmpResult {
  name: string;
  employee_id: string;
  department?: string;
}

export function EmployeeSearch({ value, onChange, error }: Props) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<EmpResult[]>([]);
  const [selected, setSelected] = useState<EmpResult | null>(null);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const debounce = useRef<NodeJS.Timeout>();
  const wrapRef  = useRef<HTMLDivElement>(null);

  // Preload all employees once
  useEffect(() => {
    employeeApi.list().then((r) => setResults(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    setSelected(null);
    setOpen(true);
    clearTimeout(debounce.current);
    if (val.length < 1) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const r = await employeeApi.search(val);
        setResults(r.data);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const pick = (emp: EmpResult) => {
    setSelected(emp);
    setQuery(`${emp.name} (${emp.employee_id})`);
    setOpen(false);
    onChange(emp.employee_id, emp.name);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className={`relative flex items-center rounded-lg border ${error ? 'border-red-400' : 'border-gray-200'} bg-white focus-within:ring-2 focus-within:ring-crimson-300 focus-within:border-crimson-400 transition-all`}>
        <Search className="absolute left-3 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name or ID (e.g. R098)…"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-4 py-2.5 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
        {loading && (
          <div className="absolute right-3 w-4 h-4 border-2 border-crimson-300 border-t-crimson-600 rounded-full animate-spin" />
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-card-lg max-h-52 overflow-y-auto animate-fade-in">
          {results.map((emp) => (
            <button
              key={emp.employee_id}
              type="button"
              onClick={() => pick(emp)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-crimson-50 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-crimson-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-crimson-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-crimson-800">
                  {emp.name}
                </p>
                <p className="text-xs text-gray-400">
                  {emp.employee_id}{emp.department ? ` · ${emp.department}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !loading && query.length > 0 && results.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-card p-4 text-center text-sm text-gray-400 animate-fade-in">
          No employees found
        </div>
      )}
    </div>
  );
}
