import type { RiskLevel } from "@/services/risksApi";

/** Level colors: green (low) -> amber -> orange -> red (critical). */
export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "#16A34A",
  medium: "#CA8A04",
  high: "#EA580C",
  critical: "#B91C1C",
};

export const RISK_HC_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "#15803D",
  medium: "#854D0E",
  high: "#C2410C",
  critical: "#7F1D1D",
};
