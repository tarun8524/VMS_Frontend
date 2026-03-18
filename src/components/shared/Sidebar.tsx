'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Bell, Search, Menu, X } from 'lucide-react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    visitApi.pendingCount().then((r) => setPendingCount(r.data.count)).catch(() => {});
    const iv = setInterval(() => {
      visitApi.pendingCount().then((r) => setPendingCount(r.data.count)).catch(() => {});
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const NavItem = ({ href, icon: Icon, label }: typeof NAV[0]) => {
    const active = pathname === href;
    const isBell = href.includes('notifications');
    return (
      <Link
        href={href}
        className={clsx(
          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
          active
            ? 'bg-red-100 text-red-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {isBell && pendingCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ─── DESKTOP sidebar (original style) ───────────────────── */}
      <aside className="hidden lg:flex h-[calc(100vh-2rem)] w-64 m-4 bg-white rounded-3xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex-col flex-shrink-0">

        {/* Logo top */}
        <div className="px-5 py-4 flex items-center justify-center">
          <Image src="/facegenie_logo.png" alt="FaceGenie" width={220} height={50} className="object-contain" priority />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-2">
          {NAV.map((item) => <NavItem key={item.href} {...item} />)}
        </nav>

        {/* Logout */}
        <div className="p-4 flex justify-center">
          <button
            onClick={logout}
            className="px-6 py-2 rounded-full bg-red-100 text-red-600 font-medium shadow-sm hover:bg-red-200 transition"
          >
            Logout
          </button>
        </div>

        {/* Logo bottom */}
        <div className="px-5 py-4 flex items-center justify-center">
          <Image src="/logo.png" alt="Logo" width={220} height={40} className="object-contain" priority />
        </div>

      </aside>

      {/* ─── MOBILE top bar ──────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <Image src="/logo.png" alt="FaceGenie" width={120} height={28} className="object-contain" priority />
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-crimson-600 text-white text-[9px] flex items-center justify-center font-bold">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── MOBILE drawer ───────────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-64 h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <Image src="/facegenie_logo.png" alt="FaceGenie" width={120} height={28} className="object-contain" priority />
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {NAV.map((item) => <NavItem key={item.href} {...item} />)}
            </nav>
            <div className="px-3 pb-4">
              <button onClick={logout} className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
                Logout
              </button>
            </div>
            <div className="px-4 py-3 flex items-center justify-center border-t border-gray-50">
              <Image src="/logo.png" alt="Logo" width={110} height={26} className="object-contain" priority />
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE bottom nav ───────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-center">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          const isBell = href.includes('notifications');
          const shortLabel = label === 'All Visits' ? 'Visits' : label === 'Search Visitor' ? 'Search' : label;
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5">
              <div className="relative">
                <Icon className={clsx('w-5 h-5', active ? 'text-crimson-600' : 'text-gray-400')} />
                {isBell && pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-crimson-600 text-white text-[9px] flex items-center justify-center font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span className={clsx('text-[10px]', active ? 'text-crimson-700 font-semibold' : 'text-gray-400')}>
                {shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
