import type {
  IncidentSeverity,
  IncidentStatus,
} from "@/services/incidentApi";

export const statusClasses: Record<IncidentStatus, string> = {
  open: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  investigating: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-prosafe-500/20 dark:text-prosafe-300 dark:border-prosafe-500/30",
  resolved: "bg-green-100 text-green-800 border-green-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  closed: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export const severityClasses: Record<IncidentSeverity, string> = {
  low: "bg-green-100 text-green-800 border-green-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  high: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  critical: "bg-red-100 text-red-800 border-red-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/35",
};

export const allowedTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["investigating", "resolved", "closed"],
  investigating: ["resolved", "closed"],
  resolved: ["investigating", "closed"],
  closed: [],
};
