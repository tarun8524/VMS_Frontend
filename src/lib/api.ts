import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://unflirtatiously-gigglier-elvina.ngrok-free.dev';

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  timeout: 60000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('vms_token');
      localStorage.removeItem('vms_employee');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: Record<string, string>) =>
    api.post('/auth/register', data),
};

// ── Employees ─────────────────────────────────────────────────────────────────
export const employeeApi = {
  search: (q: string) => api.get('/employees/search', { params: { q } }),
  list:   ()          => api.get('/employees/'),
  me:     ()          => api.get('/employees/me'),
};

// ── Visitors ──────────────────────────────────────────────────────────────────
export const visitorApi = {
  register: (fd: FormData) => api.post('/visitors/', fd),
  list:     ()              => api.get('/visitors/'),
  get:      (uid: string)   => api.get(`/visitors/${uid}`),
  delete:   (uid: string)   => api.delete(`/visitors/${uid}`),
  recognize:(fd: FormData)  => api.post('/visitors/recognize', fd),
};

// ── Visits ────────────────────────────────────────────────────────────────────
export const visitApi = {
  myVisits:     (status?: string, todayOnly?: boolean) =>
    api.get('/visits/my', {
      params: {
        ...(status ? { status } : {}),
        ...(todayOnly ? { today_only: true } : {}),
      },
    }),
  stats:        ()                 => api.get('/visits/my/stats'),
  pendingCount: ()                 => api.get('/visits/my/pending-count'),
  search:       (q: string)        => api.get('/visits/my/search', { params: { q } }),
  updateStatus: (
    visitId: string,
    status: string,
    location_id?: string,
    require_otp?: boolean,
  ) =>
    api.patch(`/visits/${visitId}/status`, { status, location_id, require_otp }),
};

// ── Locations ─────────────────────────────────────────────────────────────────
export const locationApi = {
  list: () => api.get('/locations/'),
};