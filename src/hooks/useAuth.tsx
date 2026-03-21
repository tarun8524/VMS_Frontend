'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Employee {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  department?: string;
  phone?: string;
  thumbnail?: string;
}

interface AuthCtx {
  employee: Employee | null;
  token: string | null;
  login: (token: string, emp: Employee) => void;
  logout: () => void;
  loading: boolean;
  updateThumbnail: (thumbnail: string) => void;
  updatePhone: (phone: string) => void;
}

const Ctx = createContext<AuthCtx>({
  employee: null, token: null,
  login: () => {}, logout: () => {}, loading: true,
  updateThumbnail: () => {}, updatePhone: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem('vms_token');
      const e = localStorage.getItem('vms_employee');
      if (t && e) { setToken(t); setEmployee(JSON.parse(e)); }
    } catch {
      localStorage.removeItem('vms_token');
      localStorage.removeItem('vms_employee');
    } finally { setLoading(false); }
  }, []);

  const _persist = (emp: Employee) => {
    localStorage.setItem('vms_employee', JSON.stringify(emp));
    setEmployee(emp);
  };

  const login = useCallback((tok: string, emp: Employee) => {
    localStorage.setItem('vms_token', tok);
    _persist(emp);
    setToken(tok);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_employee');
    setToken(null);
    setEmployee(null);
    window.location.href = '/';
  }, []);

  const updateThumbnail = useCallback((thumbnail: string) => {
    setEmployee(prev => {
      if (!prev) return prev;
      const updated = { ...prev, thumbnail };
      localStorage.setItem('vms_employee', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updatePhone = useCallback((phone: string) => {
    setEmployee(prev => {
      if (!prev) return prev;
      const updated = { ...prev, phone };
      localStorage.setItem('vms_employee', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <Ctx.Provider value={{ employee, token, login, logout, loading, updateThumbnail, updatePhone }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);