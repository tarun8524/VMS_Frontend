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
  employee_to_visit_id: string;
  purpose?: string;
  thumbnail?: string;
  created_at?: string;
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
}

export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  today: number;
}
