'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/shared/Sidebar';

function Guard({ children }: { children: React.ReactNode }) {
  const { employee, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !employee) router.replace('/login');
  }, [employee, loading, router]);

  if (loading || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-crimson-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Guard>
        <div className="flex bg-gray-50 min-h-screen">
          <Sidebar />
          <main className="flex-1 p-3 sm:p-4 overflow-auto min-w-0">
            {children}
          </main>
        </div>
      </Guard>
    </AuthProvider>
  );
}
