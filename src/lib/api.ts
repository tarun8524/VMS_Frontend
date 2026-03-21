import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://unflirtatiously-gigglier-elvina.ngrok-free.dev';

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  timeout: 60000,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  register:   (fd: FormData) => api.post('/visitors/', fd),
  list:       ()             => api.get('/visitors/'),
  get:        (uid: string)  => api.get(`/visitors/${uid}`),
  delete:     (uid: string)  => api.delete(`/visitors/${uid}`),
  recognize:  (fd: FormData) => api.post('/visitors/recognize', fd),
  myVisitors: ()             => api.get('/visitors/my-visitors'),

  /** Verify returning visitor by phone + email */
  verifyIdentity: (visitor_uid: string, phone: string, email: string) => {
    const fd = new FormData();
    fd.append('visitor_uid', visitor_uid);
    fd.append('phone', phone);
    fd.append('email', email);
    return api.post('/visitors/verify-identity', fd);
  },

  /** Update visitor contact details (partial) */
  updateDetails: (visitor_uid: string, fields: {
    name?: string;
    phone?: string;
    email?: string;
    photo?: Blob;
  }) => {
    const fd = new FormData();
    if (fields.name)  fd.append('name',  fields.name);
    if (fields.phone) fd.append('phone', fields.phone);
    if (fields.email) fd.append('email', fields.email);
    if (fields.photo) fd.append('photo', fields.photo, 'photo.jpg');
    return api.patch(`/visitors/${visitor_uid}/details`, fd);
  },
};

// ── Visits ────────────────────────────────────────────────────────────────────
export const visitApi = {
  // General visit list — filter by status / date / today
  myVisits: (status?: string, todayOnly?: boolean, date?: string) =>
    api.get('/visits/my', {
      params: {
        ...(status    ? { status }          : {}),
        ...(todayOnly ? { today_only: true } : {}),
        ...(date      ? { date }             : {}),
      },
    }),

  // Today's visits for the approvals page (excludes checked_out)
  notifications: () => api.get('/visits/my/notifications'),

  // Dashboard stat cards — respects time range
  stats: (range: string = '24h') =>
    api.get('/visits/my/stats', { params: { range } }),

  // Lightweight list for chart rendering
  chartData: (range: string = '7d') =>
    api.get('/visits/my/chart-data', { params: { range } }),

  // Notification badge count
  pendingCount: () => api.get('/visits/my/pending-count'),

  // Text search across visitor name / email / phone
  search: (q: string) => api.get('/visits/my/search', { params: { q } }),

  // All visit records by a specific visitor for this employee
  visitorRecords: (visitorUid: string) =>
    api.get(`/visits/my/visitor/${visitorUid}`),

  // Status update (approve / reject / check-in / check-out)
  updateStatus: (
    visitId: string,
    status: string,
    location_id?: string,
    require_otp?: boolean,
  ) => api.patch(`/visits/${visitId}/status`, { status, location_id, require_otp }),
};

// ── Locations ─────────────────────────────────────────────────────────────────
export const locationApi = {
  list: () => api.get('/locations/'),
};