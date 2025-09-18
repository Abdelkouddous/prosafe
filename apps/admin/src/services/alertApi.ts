import api from "./api";

export interface Alert {
  id: number;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status:
    | "monitoring"
    | "unresolved"
    | "investigating"
    | "resolved"
    | "dismissed";
  type:
    | "security"
    | "system"
    | "network"
    | "user_activity"
    | "compliance"
    | "performance";
  source_ip?: string;
  affected_user_id?: number;
  affected_user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  resolved_by_id?: number;
  resolved_by?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  resolved_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface AlertStats {
  total: number;
  unresolved: number;
  resolved: number;
  monitoring: number;

  critical: number;
  high: number;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  page: number;
  totalPages: number;
}

export const alertApi = {
  getAlerts: (page = 1, limit = 10, severity?: string, status?: string) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (severity) params.append("severity", severity);
    if (status) params.append("status", status);

    return api.get<AlertsResponse>(`/alerts?${params.toString()}`);
  },

  getAlert: (id: number) => {
    return api.get<Alert>(`/alerts/${id}`);
  },

  updateAlert: (id: number, data: { status?: string }) => {
    return api.patch<Alert>(`/alerts/${id}`, data);
  },

  deleteAlert: (id: number) => {
    return api.delete(`/alerts/${id}`);
  },

  getAlertStats: () => {
    return api.get<AlertStats>("/alerts/stats");
  },

  createAlert: (data: {
    title: string;
    description: string;
    severity: string;
    type: string;
    source_ip?: string;
    affected_user_id?: number;
    metadata?: any;
  }) => {
    return api.post<Alert>("/alerts", data);
  },
};
