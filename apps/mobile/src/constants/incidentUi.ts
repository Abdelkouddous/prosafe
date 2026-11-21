import type { IncidentSeverity, IncidentStatus } from "@/services/incidentApi";
import { Palette } from "@/constants/Colors";

// Red/orange = alert, green = validated/resolved
export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  low: Palette.success,
  medium: "#F59E0B",
  high: Palette.warning,
  critical: Palette.danger,
};

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  open: Palette.warning,
  investigating: Palette.info,
  resolved: Palette.success,
  closed: Palette.neutral,
};
