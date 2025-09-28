import api from "./api";

export interface Incident {
  id: number;
  incidentId: string;
  description: string;
  type:
    | "accident"
    | "near_miss"
    | "unsafe_condition"
    | "environmental"
    | "security";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved";
  reporter_name?: string;
  reporter_email?: string;
  reporter?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  location?: {
    lat?: number;
    long?: number;
    manualAddress?: string;
  };
  photo_url?: string;
  resolved_by_id?: number;
  resolved_by?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  resolved_at?: string;
  created_at: string;
  updatedAt: string;
}

export interface IncidentStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface IncidentsResponse {
  incidents: Incident[];
  total: number;
  page: number;
  totalPages: number;
}

export const incidentApi = {
  // Update the getIncidents function to handle both paginated and direct array responses
  getIncidents: (
    page = 1,
    limit = 10,
    severity?: string,
    status?: string,
    type?: string
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (severity) params.append("severity", severity);
    if (status) params.append("status", status);
    if (type) params.append("type", type);

    return api.get<IncidentsResponse | Incident[]>(
      `/incidents?${params.toString()}`
    );
  },

  getIncident: (incidentId: string) => {
    return api.get<Incident>(`/incidents/${incidentId}`);
  },

  updateIncident: (
    incidentId: string, // Change from number to string
    data: {
      status?: string;
      severity?: string;
      resolved_by_id?: number;
    }
  ) => {
    // here is where we update the incident status after we click on button
    return api.patch<Incident>(`/incidents/${incidentId}/status`, data); // Use the status endpoint
  },

  deleteIncident: (id: number) => {
    return api.delete(`/incidents/${id}`);
  },

  getIncidentStats: () => {
    return api.get<IncidentStats>("/incidents/stats");
  },

  createIncident: (data: FormData) => {
    return api.post<Incident>("/incidents", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getIncidentPhoto: (id: number) => {
    return api.get(`/incidents/${id}/photo`, {
      responseType: "blob",
    });
  },

  assignIncident: (id: number, userId: number) => {
    return api.patch<Incident>(`/incidents/${id}/assign`, {
      assigned_to_id: userId,
    });
  },

  getRecentIncidents: (limit = 5) => {
    return api.get<Incident[]>(`/incidents/recent?limit=${limit}`);
  },
};
