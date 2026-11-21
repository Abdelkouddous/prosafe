import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { riskClasses } from "@/components/incidents/riskUi";
import type { ActionPlan, ActionPlanStatus, RiskLevel, RiskStatus } from "@/services/risksApi";

export const LevelBadge = ({ level, score }: { level: RiskLevel; score?: number }) => {
  const { t } = useTranslation();
  return (
    <Badge className={riskClasses[level]}>
      {score != null ? `${score} · ` : ""}
      {t(`risks.levels.${level}`)}
    </Badge>
  );
};

export const riskStatusClasses: Record<RiskStatus, string> = {
  proposed: "bg-orange-100 text-orange-800 border-orange-200",
  validated: "bg-blue-100 text-blue-800 border-blue-200",
  mitigated: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
};

export const planStatusClasses: Record<ActionPlanStatus, string> = {
  planned: "bg-orange-100 text-orange-800 border-orange-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  validated: "bg-emerald-200 text-emerald-900 border-emerald-300",
};

/** Solid colours for matrix cells. */
export const cellClasses: Record<RiskLevel, string> = {
  low: "bg-green-200 hover:bg-green-300 text-green-900",
  medium: "bg-yellow-200 hover:bg-yellow-300 text-yellow-900",
  high: "bg-orange-300 hover:bg-orange-400 text-orange-950",
  critical: "bg-red-400 hover:bg-red-500 text-white",
};

export const planOverdue = (p: Pick<ActionPlan, "dueDate" | "status">) =>
  !!p.dueDate &&
  (p.status === "planned" || p.status === "in_progress") &&
  new Date(p.dueDate).getTime() < Date.now();

export const fullName = (u?: { firstName: string; lastName: string } | null) =>
  u ? `${u.firstName} ${u.lastName}` : "";
