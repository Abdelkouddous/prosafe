import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { Audit, AuditStatus } from "@/services/auditsApi";
import type { TFunction } from "i18next";
import type { SectionTab } from "@/components/SectionTabs";

export const auditStatusClasses: Record<AuditStatus, string> = {
  planned: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export const AuditStatusBadge = ({ status }: { status: AuditStatus }) => {
  const { t } = useTranslation();
  return <Badge className={auditStatusClasses[status]}>{t(`audits.statuses.${status}`)}</Badge>;
};

/** Green >= 80, orange >= 70, red below (backend raises a compliance alert under 70). */
export const scoreClass = (s?: number | null) =>
  s == null ? "text-gray-500" : s >= 80 ? "text-green-600" : s >= 70 ? "text-orange-600" : "text-red-600";

export const auditorLabel = (a: Pick<Audit, "auditor" | "auditorName">) =>
  a.auditor ? `${a.auditor.firstName} ${a.auditor.lastName}` : a.auditorName || "—";

export const auditTabs = (t: TFunction): SectionTab[] => [
  { to: "/audits", label: t("audits.nav.audits"), end: true },
  { to: "/compliance", label: t("audits.nav.documents") },
];
