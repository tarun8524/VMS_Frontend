'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Bell, Search, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { visitApi } from '@/lib/api';
import clsx from 'clsx';
import Image from 'next/image';

// ✏️ Adjust logo size here independently
const LOGO_HEIGHT = 'h-10';   // e.g. h-8, h-10, h-12, h-14, h-16
const LOGO_WIDTH  = 'w-auto'; // e.g. w-auto, w-28, w-36, w-44

const NAV = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard'      },
  { href: '/dashboard/visits',        icon: Users,           label: 'All Visits'     },
  { href: '/dashboard/notifications', icon: Bell,            label: 'Approvals'      },
  { href: '/dashboard/search',        icon: Search,          label: 'Search Visitor' },
];

export function Sidebar() {
  const { employee, logout } = useAuth();
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
    <aside className="h-[calc(100vh-2rem)] w-64 m-4 bg-white rounded-3xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex flex-col">

  {/* Logo */}
    <div className="px-5 py-4 flex items-center justify-center">
      <Image
        src="/facegenie_logo.png"
        alt="Logo"
        width={220}
        height={50}
        className="object-contain"
        priority
      />
    </div>

    {/* Nav */}
    <nav className="flex-1 px-3 py-4 flex flex-col gap-2">

      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        const isBell = href.includes('notifications');

        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
              active
                ? 'bg-red-100 text-red-600'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="flex-1">{label}</span>

            {isBell && pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </Link>
        );
      })}

    </nav>

    {/* Logout Button (Bottom Rounded Style) */}
    <div className="p-4 flex justify-center">
      <button
        onClick={logout}
        className="px-6 py-2 rounded-full bg-red-100 text-red-600 font-medium shadow-sm hover:bg-red-200 transition"
      >
        Logout
      </button>
    </div>

    <div className="px-5 py-4 flex items-center justify-center">
      <Image
        src="/logo.png"
        alt="Logo"
        width={220}
        height={40}
        className="object-contain"
        priority
      />
    </div>

  </aside>
  );
}