import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://unflirtatiously-gigglier-elvina.ngrok-free.dev';

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  timeout: 60000,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
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
  login: (email: string, password: string) => {
    const fd = new FormData();
    fd.append('email', email);
    fd.append('password', password);
    return api.post('/auth/login', fd);
  },
  register: (data: {
    name: string;
    email: string;
    employee_id: string;
    department?: string;
    phone?: string;
    password: string;
    photo?: Blob | null;
  }) => {
    const fd = new FormData();
    fd.append('name',        data.name);
    fd.append('email',       data.email);
    fd.append('employee_id', data.employee_id);
    if (data.department) fd.append('department', data.department);
    if (data.phone)      fd.append('phone',      data.phone);
    fd.append('password', data.password);
    if (data.photo)      fd.append('photo', data.photo, 'photo.jpg');
    return api.post('/auth/register', fd);
  },
};

// ── Employees ─────────────────────────────────────────────────────────────────
export const employeeApi = {
  search:      (q: string)   => api.get('/employees/search', { params: { q } }),
  list:        ()            => api.get('/employees/'),
  me:          ()            => api.get('/employees/me'),
  uploadPhoto: (photo: Blob) => {
    const fd = new FormData();
    fd.append('photo', photo, 'photo.jpg');
    return api.patch('/employees/me/photo', fd);
  },
  updatePhone: (phone: string) => {
    const fd = new FormData();
    fd.append('phone', phone);
    return api.patch('/employees/me/phone', fd);
  },
};

// ── Visitors ──────────────────────────────────────────────────────────────────
export const visitorApi = {
  register:   (fd: FormData)  => api.post('/visitors/', fd),
  list:       ()              => api.get('/visitors/'),
  get:        (uid: string)   => api.get(`/visitors/${uid}`),
  delete:     (uid: string)   => api.delete(`/visitors/${uid}`),

  /**
   * Global face search — used only in the visitor check-in flow (page.tsx)
   * where we don't know which employee they belong to yet.
   */
  recognize: (fd: FormData) => api.post('/visitors/recognize', fd),

  /**
   * Employee-scoped face search — used in the dashboard Search page.
   * Only returns visitors who have previously visited THIS employee.
   * Returns at most ONE best match.
   */
  recognizeForEmployee: (fd: FormData) =>
    api.post('/visitors/recognize-for-employee', fd),

  myVisitors: ()              => api.get('/visitors/my-visitors'),

  verifyIdentity: (visitor_uid: string, phone: string, email: string) => {
    const fd = new FormData();
    fd.append('visitor_uid', visitor_uid);
    fd.append('phone',       phone);
    fd.append('email',       email);
    return api.post('/visitors/verify-identity', fd);
  },

  updateDetails: (visitor_uid: string, fields: {
    name?: string; phone?: string; email?: string; photo?: Blob;
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
  myVisits: (status?: string, todayOnly?: boolean, date?: string) =>
    api.get('/visits/my', {
      params: {
        ...(status    ? { status }          : {}),
        ...(todayOnly ? { today_only: true } : {}),
        ...(date      ? { date }             : {}),
      },
    }),

  notifications:   ()                      => api.get('/visits/my/notifications'),
  stats:           (range: string = '24h') => api.get('/visits/my/stats',      { params: { range } }),
  chartData:       (range: string = '7d')  => api.get('/visits/my/chart-data', { params: { range } }),
  pendingCount:    ()                      => api.get('/visits/my/pending-count'),
  search:          (q: string)             => api.get('/visits/my/search',     { params: { q } }),
  visitorRecords:  (visitorUid: string)    => api.get(`/visits/my/visitor/${visitorUid}`),

  updateStatus: (
    visitId: string, status: string,
    location_id?: string, require_otp?: boolean,
  ) => api.patch(`/visits/${visitId}/status`, { status, location_id, require_otp }),
};

// ── Locations ─────────────────────────────────────────────────────────────────
export const locationApi = {
  list: () => api.get('/locations/'),
};