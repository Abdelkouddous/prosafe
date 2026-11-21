export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Same bands as the risk matrix: 1-4 low, 5-9 medium, 10-16 high, 20-25 critical. */
export const riskLevel = (score: number): RiskLevel =>
  score >= 17 ? "critical" : score >= 10 ? "high" : score >= 5 ? "medium" : "low";

export const riskClasses: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-300",
};
