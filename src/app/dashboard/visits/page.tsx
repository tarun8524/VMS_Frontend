'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { visitApi } from '@/lib/api';
import { Visit, VisitStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

const TABS: { label: string; value: string }[] = [
  { label: 'All',         value: ''            },
  { label: 'Pending',     value: 'pending'     },
  { label: 'Approved',    value: 'approved'    },
  { label: 'Rejected',    value: 'rejected'    },
  { label: 'Checked In',  value: 'checked_in'  },
];

export default function VisitsPage() {
  const [visits, setVisits]   = useState<Visit[]>([]);
  const [tab, setTab]         = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (status: string) => {
    setLoading(true);
    try {
      const { data } = await visitApi.myVisits(status || undefined);
      setVisits(data);
    } catch {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(tab); }, [tab]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Visit Records</h1>
          <p className="text-gray-500 mt-1">All visitor requests assigned to you</p>
        </div>
        <button onClick={() => load(tab)} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.value
                ? 'bg-white text-crimson-700 shadow-sm font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No visits found</p>
          <p className="text-sm text-gray-400 mt-1">
            {tab ? `No ${tab} visits to show` : 'Visitors will appear here once registered'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-4">Visitor</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">Purpose</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visits.map((v, i) => (
                  <tr key={v.visit_id} className="hover:bg-gray-50 transition-colors" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {v.visitor_thumbnail ? (
                          <img src={`data:image/jpeg;base64,${v.visitor_thumbnail}`}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-crimson-100 flex items-center justify-center text-crimson-600 text-sm font-bold">
                            {v.visitor_name.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-gray-900 text-sm">{v.visitor_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-700">{v.visitor_phone}</p>
                      <p className="text-xs text-gray-400">{v.visitor_email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[160px] truncate">
                      {v.purpose || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
