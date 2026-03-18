'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/shared/Sidebar';

function Guard({ children }: { children: React.ReactNode }) {
  const { employee, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !employee) router.replace('/');
  }, [employee, loading, router]);

  if (loading || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-crimson-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Guard>
        <div className="flex bg-[#f5f5f5] min-h-screen">
          <Sidebar />
          {/*
            Mobile:  pt-16 (top bar) + pb-20 (bottom nav) + px-3
            Desktop: p-6 as before
          */}
          <main className="flex-1 min-w-0 overflow-auto
                           pt-16 pb-20 px-3
                           lg:pt-6 lg:pb-6 lg:px-6">
            {children}
          </main>
        </div>
      </Guard>
    </AuthProvider>
  );
}
