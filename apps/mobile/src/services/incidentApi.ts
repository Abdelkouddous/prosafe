import { Platform } from "react-native";
import api from "./api";

export const INCIDENT_TYPES = [
  "safety",
  "security",
  "hr_violation",
  "environment",
  "near_miss",
  "equipment_failure",
  "other",
] as const;
export const INCIDENT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const INCIDENT_STATUSES = [
  "open",
  "investigating",
  "resolved",
  "closed",
] as const;

export type IncidentType = (typeof INCIDENT_TYPES)[number];
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export interface IncidentMedia {
  id: number | string;
  kind: "image" | "video" | string;
  mimeType: string;
}

export interface Incident {
  id: number;
  incidentId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description?: string | null;
  notes?: string | null;
  zone?: string | null;
  department?: string | null;
  timestamp: string;
  geoLatitude?: number | string | null;
  geoLongitude?: number | string | null;
  manualAddress?: string | null;
  media?: IncidentMedia[];
  createdAt: string;
  resolvedAt?: string | null;
}

export interface IncidentHistoryEntry {
  id?: number | string;
  fromStatus?: IncidentStatus | null;
  toStatus: IncidentStatus;
  comment?: string | null;
  changedAt: string;
  changedBy?: { firstName?: string; lastName?: string } | null;
}

export interface IncidentDetail extends Incident {
  history?: IncidentHistoryEntry[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface IncidentListParams {
  page?: number;
  limit?: number;
  status?: IncidentStatus;
  type?: IncidentType;
  severity?: IncidentSeverity;
  from?: string;
  to?: string;
  search?: string;
}

export interface LocalMediaFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  kind: "image" | "video";
}

export interface CreateIncidentInput {
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  notes?: string;
  date?: Date;
  latitude?: number;
  longitude?: number;
  manualAddress?: string;
  zone?: string;
  department?: string;
  media: LocalMediaFile[];
}

export interface CreateIncidentResult {
  incidentId: string;
  id: number;
  reward?: { pointsAwarded?: number; points?: number; totalPoints?: number } | number | null;
}

export const MAX_MEDIA = 5;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_VIDEO_MIMES = ["video/mp4", "video/quicktime"];

export const rewardPoints = (r: CreateIncidentResult["reward"]): number | null => {
  if (typeof r === "number") return r;
  if (r && typeof r === "object") {
    if (typeof r.pointsAwarded === "number") return r.pointsAwarded;
    if (typeof r.points === "number") return r.points;
  }
  return null;
};

export const fetchIncidents = async (
  params: IncidentListParams = {}
): Promise<Paginated<Incident>> => {
  const res = await api.get("/incidents", { params });
  return res.data;
};

export const fetchIncident = async (id: string | number): Promise<IncidentDetail> => {
  const res = await api.get(`/incidents/${id}`);
  return res.data;
};

export const createIncident = async (
  input: CreateIncidentInput,
  onProgress?: (fraction: number) => void
): Promise<CreateIncidentResult> => {
  const form = new FormData();
  form.append("type", input.type);
  form.append("severity", input.severity);
  form.append("description", input.description);
  if (input.notes) form.append("notes", input.notes);
  if (input.date) form.append("date", input.date.toISOString());
  if (input.latitude !== undefined && input.longitude !== undefined) {
    form.append("latitude", String(input.latitude));
    form.append("longitude", String(input.longitude));
  }
  if (input.manualAddress) form.append("manualAddress", input.manualAddress);
  if (input.zone) form.append("zone", input.zone);
  if (input.department) form.append("department", input.department);

  for (const m of input.media) {
    if (Platform.OS === "web") {
      const blob = await (await fetch(m.uri)).blob();
      form.append("media", blob, m.name);
    } else {
      // React Native file descriptor
      form.append("media", {
        uri: m.uri,
        name: m.name,
        type: m.mimeType,
      } as unknown as Blob);
    }
  }

  const res = await api.post("/incidents", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300000,
    transformRequest: (data) => data,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(e.loaded / e.total);
    },
  });
  return res.data;
};
