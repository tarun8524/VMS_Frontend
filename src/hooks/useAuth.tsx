'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface Employee {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  department?: string;
}

interface AuthCtx {
  employee: Employee | null;
  token: string | null;
  login: (token: string, emp: Employee) => void;
  logout: () => void;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({
  employee: null, token: null,
  login: () => {}, logout: () => {}, loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem('vms_token');
      const e = localStorage.getItem('vms_employee');
      if (t && e) {
        setToken(t);
        setEmployee(JSON.parse(e));
      }
    } catch {
      // corrupted storage — clear it
      localStorage.removeItem('vms_token');
      localStorage.removeItem('vms_employee');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((tok: string, emp: Employee) => {
    localStorage.setItem('vms_token', tok);
    localStorage.setItem('vms_employee', JSON.stringify(emp));
    setToken(tok);
    setEmployee(emp);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_employee');
    setToken(null);
    setEmployee(null);
    window.location.href = '/';
  }, []);

  return (
    <Ctx.Provider value={{ employee, token, login, logout, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);