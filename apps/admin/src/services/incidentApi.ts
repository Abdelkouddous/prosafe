import api from "./api";

export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";
export type IncidentType =
  | "safety"
  | "security"
  | "hr_violation"
  | "environment"
  | "near_miss"
  | "equipment_failure"
  | "other";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "open",
  "investigating",
  "resolved",
  "closed",
];
export const INCIDENT_TYPES: IncidentType[] = [
  "safety",
  "security",
  "hr_violation",
  "environment",
  "near_miss",
  "equipment_failure",
  "other",
];
export const INCIDENT_SEVERITIES: IncidentSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export interface PersonRef {
  id: number;
  firstName: string;
  lastName: string;
}

export interface IncidentMedia {
  id: number;
  kind: "image" | "video";
  mimeType: string;
}

export interface IncidentHistoryEntry {
  id: number;
  fromStatus: IncidentStatus | null;
  toStatus: IncidentStatus;
  comment?: string | null;
  changedAt: string;
  changedBy?: PersonRef | null;
}

export interface Incident {
  id: number;
  incidentId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  notes?: string | null;
  zone?: string | null;
  department?: string | null;
  timestamp: string;
  geoLatitude?: number | string | null;
  geoLongitude?: number | string | null;
  manualAddress?: string | null;
  reporter?: PersonRef | null;
  resolver?: PersonRef | null;
  media: IncidentMedia[];
  history?: IncidentHistoryEntry[];
  createdAt: string;
  resolvedAt?: string | null;
}

export interface IncidentsResponse {
  data: Incident[];
  total: number;
  page: number;
  limit: number;
}

export interface IncidentFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  severity?: string;
  from?: string;
  to?: string;
  zone?: string;
  department?: string;
  search?: string;
  reporterId?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface CreateIncidentInput {
  type: string;
  severity: string;
  description: string;
  notes?: string;
  date?: string;
  latitude?: number;
  longitude?: number;
  manualAddress?: string;
  zone?: string;
  department?: string;
  media?: File[];
}

export const getIncidentCoords = (
  i: Pick<Incident, "geoLatitude" | "geoLongitude">
): [number, number] | null => {
  if (i.geoLatitude == null || i.geoLongitude == null) return null;
  const lat = Number(i.geoLatitude);
  const lng = Number(i.geoLongitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

export const incidentApi = {
  list: (filters: IncidentFilters = {}) => {
    const params: Record<string, string | number> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params[k] = v as string | number;
    });
    return api.get<IncidentsResponse>("/incidents", { params });
  },

  get: (id: number | string) => api.get<Incident>(`/incidents/${id}`),

  updateStatus: (id: number | string, status: IncidentStatus, comment?: string) =>
    api.patch<Incident>(`/incidents/${id}/status`, {
      status,
      ...(comment ? { comment } : {}),
    }),

  create: (input: CreateIncidentInput) => {
    const fd = new FormData();
    const { media, ...fields } = input;
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, String(v));
    });
    (media || []).forEach((f) => fd.append("media", f));
    return api.post<Incident & { rewardPoints?: number }>("/incidents", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
  },

  /** Fetch a stored file with the bearer token; caller must revoke the URL. */
  fetchFileBlobUrl: async (fileId: number): Promise<string> => {
    const res = await api.get<Blob>(`/files/${fileId}`, {
      responseType: "blob",
      timeout: 120000,
    });
    return URL.createObjectURL(res.data);
  },
};
