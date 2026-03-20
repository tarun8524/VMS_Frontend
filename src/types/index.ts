export interface Employee {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  department?: string;
}

export interface Visitor {
  visitor_uid: string;
  name: string;
  phone: string;
  email: string;
  thumbnail?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VisitorWithStats {
  visitor_uid: string;
  name: string;
  email: string;
  phone: string;
  thumbnail?: string;
  total_visits: number;
  rejected_visits: number;
  last_visit?: string;
}

export type VisitStatus = 'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out';

export interface Visit {
  visit_id: string;
  visitor_uid: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_email: string;
  visitor_thumbnail?: string;
  employee_id: string;
  employee_name?: string;
  purpose?: string;
  status: VisitStatus;
  created_at: string;
  updated_at?: string;
  location_id?: string;
  location_name?: string;
  otp?: string;
  require_otp?: boolean;
}

export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  today: number;
  time_range: string;
}

export interface Location {
  location_id: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  maps_url: string;
}

export type TimeRange = '24h' | '7d' | '30d' | 'all';