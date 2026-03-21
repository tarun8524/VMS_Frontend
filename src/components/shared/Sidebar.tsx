'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Bell, Search, Menu, X,
  Camera, Phone, Pencil, Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { visitApi, employeeApi } from '@/lib/api';
import { PhoneInput, toFullPhone, COUNTRIES, type Country } from '@/components/ui/PhoneInput';
import clsx from 'clsx';
import Image from 'next/image';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard'      },
  { href: '/dashboard/visits',        icon: Users,           label: 'All Visits'     },
  { href: '/dashboard/notifications', icon: Bell,            label: 'Approvals'      },
  { href: '/dashboard/search',        icon: Search,          label: 'Search Visitor' },
];

// ── Employee avatar with click-to-upload ──────────────────────────────────────
function EmployeeAvatar({
  employee, size = 'md', onPhotoUpdate,
}: {
  employee: { name: string; thumbnail?: string };
  size?: 'sm' | 'md';
  onPhotoUpdate?: (thumbnail: string) => void;
}) {
  const fileRef         = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const dim             = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-base';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onPhotoUpdate) return;
    try {
      const { data } = await employeeApi.uploadPhoto(file);
      onPhotoUpdate(data.thumbnail);
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Photo update failed — make sure your face is visible');
    }
    e.target.value = '';
  };

  return (
    <div
      className={`relative flex-shrink-0 ${onPhotoUpdate ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onPhotoUpdate && fileRef.current?.click()}
      title={onPhotoUpdate ? 'Click to update photo' : undefined}
    >
      {employee.thumbnail ? (
        <img
          src={`data:image/jpeg;base64,${employee.thumbnail}`}
          alt={employee.name}
          className={`${dim} rounded-full object-cover border-2 border-white shadow-sm`}
        />
      ) : (
        <div className={`${dim} rounded-full bg-crimson-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-crimson-700`}>
          {employee.name.charAt(0).toUpperCase()}
        </div>
      )}
      {onPhotoUpdate && hover && (
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
          <Camera className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      {onPhotoUpdate && (
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      )}
    </div>
  );
}

// ── Inline phone editor ───────────────────────────────────────────────────────
function PhoneEditor({
  currentPhone,
  onSave,
}: {
  currentPhone?: string;
  onSave: (phone: string) => void;
}) {
  const [editing, setEditing]         = useState(false);
  const [digits, setDigits]           = useState('');
  const [country, setCountry]         = useState<Country>(COUNTRIES[0]);
  const [saving, setSaving]           = useState(false);

  const save = async () => {
    if (!digits) return;
    setSaving(true);
    try {
      const full = toFullPhone(country.code, digits);
      await employeeApi.updatePhone(full);
      onSave(full);
      toast.success('Phone updated!');
      setEditing(false);
      setDigits('');
    } catch {
      toast.error('Failed to update phone');
    } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="mt-1.5 space-y-1.5">
        <PhoneInput
          value={digits}
          onChange={setDigits}
          onCountryChange={setCountry}
          className="text-xs"
        />
        <div className="flex gap-1.5">
          <button onClick={save} disabled={!digits || saving}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
            {saving ? '…' : <><Check className="w-3 h-3" />Save</>}
          </button>
          <button onClick={() => { setEditing(false); setDigits(''); }}
            className="flex-1 py-1 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400 hover:text-crimson-600 transition-colors group"
    >
      <Phone className="w-2.5 h-2.5" />
      <span className={currentPhone ? 'text-gray-500' : 'italic'}>
        {currentPhone || 'Add phone'}
      </span>
      <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ── Employee info card ────────────────────────────────────────────────────────
function EmployeeCard({
  onPhotoUpdate,
  onPhoneUpdate,
}: {
  onPhotoUpdate: (t: string) => void;
  onPhoneUpdate: (p: string) => void;
}) {
  const { employee } = useAuth();
  if (!employee) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-100">
      <div className="flex items-center gap-3">
        <EmployeeAvatar employee={employee} size="md" onPhotoUpdate={onPhotoUpdate} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate leading-tight">{employee.name}</p>
          <p className="text-[11px] text-gray-400 font-mono">{employee.employee_id}</p>
          {employee.department && (
            <p className="text-[11px] text-gray-400 truncate">{employee.department}</p>
          )}
          <PhoneEditor currentPhone={employee.phone} onSave={onPhoneUpdate} />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { employee, logout, updateThumbnail, updatePhone } = useAuth();
  const pathname      = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  useEffect(() => {
    visitApi.pendingCount().then(r => setPendingCount(r.data.count)).catch(() => {});
    const iv = setInterval(() => {
      visitApi.pendingCount().then(r => setPendingCount(r.data.count)).catch(() => {});
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const NavItem = ({ href, icon: Icon, label }: typeof NAV[0]) => {
    const active = pathname === href;
    const isBell = href.includes('notifications');
    return (
      <Link href={href} className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
        active ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}>
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
      {/* ─── DESKTOP sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex h-[calc(100vh-2rem)] w-64 m-4 bg-white rounded-3xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex-col flex-shrink-0">
        <div className="px-5 py-4 flex items-center justify-center">
          <Image src="/facegenie_logo.png" alt="FaceGenie" width={220} height={50} className="object-contain" priority />
        </div>

        {/* Employee card */}
        <EmployeeCard onPhotoUpdate={updateThumbnail} onPhoneUpdate={updatePhone} />

        <nav className="flex-1 px-3 py-4 flex flex-col gap-2">
          {NAV.map(item => <NavItem key={item.href} {...item} />)}
        </nav>

        <div className="p-4 flex justify-center">
          <button onClick={logout} className="px-6 py-2 rounded-full bg-red-100 text-red-600 font-medium shadow-sm hover:bg-red-200 transition">
            Logout
          </button>
        </div>

        <div className="px-5 py-4 flex items-center justify-center">
          <Image src="/logo.png" alt="Logo" width={220} height={40} className="object-contain" priority />
        </div>
      </aside>

      {/* ─── MOBILE top bar ──────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            {employee && <EmployeeAvatar employee={employee} size="sm" onPhotoUpdate={updateThumbnail} />}
            <Image src="/logo.png" alt="FaceGenie" width={90} height={24} className="object-contain" priority />
          </div>
          <button onClick={() => setDrawerOpen(true)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
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

            {/* Employee card in drawer */}
            {employee && (
              <div className="px-4 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <EmployeeAvatar
                    employee={employee} size="md"
                    onPhotoUpdate={t => { updateThumbnail(t); }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{employee.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{employee.employee_id}</p>
                    {employee.department && <p className="text-xs text-gray-400 truncate">{employee.department}</p>}
                    {employee.phone && (
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5" />{employee.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {NAV.map(item => <NavItem key={item.href} {...item} />)}
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
          const active     = pathname === href;
          const isBell     = href.includes('notifications');
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