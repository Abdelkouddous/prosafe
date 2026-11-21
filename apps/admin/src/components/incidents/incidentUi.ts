import type {
  IncidentSeverity,
  IncidentStatus,
} from "@/services/incidentApi";

export const statusClasses: Record<IncidentStatus, string> = {
  open: "bg-orange-100 text-orange-800 border-orange-200",
  investigating: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
};

export const severityClasses: Record<IncidentSeverity, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-300",
};

export const allowedTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["investigating", "resolved", "closed"],
  investigating: ["resolved", "closed"],
  resolved: ["investigating", "closed"],
  closed: [],
};
