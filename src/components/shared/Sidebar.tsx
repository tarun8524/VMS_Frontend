'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Bell, Search,
  LogOut, Building2, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { visitApi } from '@/lib/api';
import clsx from 'clsx';

const NAV = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard'      },
  { href: '/dashboard/visits',        icon: Users,            label: 'All Visits'     },
  { href: '/dashboard/notifications', icon: Bell,             label: 'Approvals'      },
  { href: '/dashboard/search',        icon: Search,           label: 'Search Visitor' },
];

export function Sidebar() {
  const { employee, logout } = useAuth();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    visitApi.pendingCount()
      .then((r) => setPendingCount(r.data.count))
      .catch(() => {});
    const iv = setInterval(() => {
      visitApi.pendingCount().then((r) => setPendingCount(r.data.count)).catch(() => {});
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-crimson-700 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-gray-900 leading-none">VisitorVault</p>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5">Management</p>
          </div>
        </div>
      </div>

      {/* Employee info */}
      {employee && (
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-crimson-100 flex items-center justify-center font-semibold text-crimson-700 text-sm">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{employee.name}</p>
              <p className="text-xs text-gray-400 font-mono">{employee.employee_id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          const isBell = href.includes('notifications');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-crimson-50 text-crimson-800'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={clsx('w-4 h-4', active ? 'text-crimson-600' : 'text-gray-400')} />
              <span className="flex-1">{label}</span>
              {isBell && pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-crimson-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse-dot">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-crimson-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
