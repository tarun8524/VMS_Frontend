'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { visitApi } from '@/lib/api';
import clsx from 'clsx';
import Image from 'next/image';

const NAV = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard'      },
  { href: '/dashboard/visits',        icon: Users,           label: 'All Visits'     },
  { href: '/dashboard/notifications', icon: Bell,            label: 'Approvals'      },
  { href: '/dashboard/search',        icon: Search,          label: 'Search Visitor' },
];

export function Sidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    visitApi.pendingCount().then((r) => setPendingCount(r.data.count)).catch(() => {});
    const iv = setInterval(() => {
      visitApi.pendingCount().then((r) => setPendingCount(r.data.count)).catch(() => {});
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <aside className="h-[calc(100vh-1.5rem)] w-56 m-3 bg-white rounded-2xl border border-gray-100 shadow-card flex flex-col flex-shrink-0">

      {/* Logo top */}
      <div className="px-4 py-3 flex items-center justify-center border-b border-gray-50">
        <Image
          src="/facegenie_logo.png"
          alt="FaceGenie"
          width={160}
          height={38}
          className="object-contain"
          priority
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          const isBell = href.includes('notifications');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-crimson-50 text-crimson-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', active ? 'text-crimson-600' : 'text-gray-400')} />
              <span className="flex-1 truncate">{label}</span>
              {isBell && pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-crimson-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-3">
        <button
          onClick={logout}
          className="w-full py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Logo bottom */}
      <div className="px-4 py-3 flex items-center justify-center border-t border-gray-50">
        <Image
          src="/logo.png"
          alt="Logo"
          width={140}
          height={32}
          className="object-contain"
          priority
        />
      </div>

    </aside>
  );
}
