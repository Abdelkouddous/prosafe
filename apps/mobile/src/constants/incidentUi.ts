import type { IncidentSeverity, IncidentStatus } from "@/services/incidentApi";

// Red/orange = alert, green = validated/resolved
export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  low: "#16A34A",
  medium: "#F59E0B",
  high: "#EA580C",
  critical: "#DC2626",
};

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  open: "#EA580C",
  investigating: "#2563EB",
  resolved: "#16A34A",
  closed: "#6B7280",
};
