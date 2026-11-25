import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ShieldAlert,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import {
  computeResolutionFraction,
  type IncidentStatusTotals,
} from "@/lib/dashboardMetrics";
import type { Incident } from "@/services/incidentApi";

interface PriorityQueueCardProps {
  incidents: IncidentStatusTotals;
  overdueActions: number;
  recent: Incident[];
}

const COPY = {
  fr: {
    resolutionTitle: "Résolution",
    queueTitle: "File prioritaire",
    resolvedLbl: "Résolus",
    activeLbl: "Analyse",
    openLbl: "Ouverts",
    activeCountLbl: "actifs",
    overdueSingle: "action corrective en retard",
    overduePlural: "actions correctives en retard",
    onTrack: "Toutes les actions sont à jour",
    viewAll: "Tout voir",
    empty: "Aucun incident récent à traiter.",
  },
  en: {
    resolutionTitle: "Resolution",
    queueTitle: "Priority Queue",
    resolvedLbl: "Resolved",
    activeLbl: "Active",
    openLbl: "Open",
    activeCountLbl: "active",
    overdueSingle: "overdue corrective action",
    overduePlural: "overdue corrective actions",
    onTrack: "All corrective actions on track",
    viewAll: "View all",
    empty: "No recent incidents in queue.",
  },
  ar: {
    resolutionTitle: "نسبة المعالجة",
    queueTitle: "قائمة الأولويات",
    resolvedLbl: "مغلقة",
    activeLbl: "تحليل",
    openLbl: "مفتوحة",
    activeCountLbl: "نشطة",
    overdueSingle: "إجراء تصحيحي متأخر",
    overduePlural: "إجراءات تصحيحية متأخرة",
    onTrack: "جميع الإجراءات في موعدها",
    viewAll: "عرض الكل",
    empty: "لا توجد حوادث حديثة.",
  },
} as const;

const PriorityQueueCard = ({
  incidents,
  overdueActions,
  recent,
}: PriorityQueueCardProps) => {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const locale = usePublicLocale();
  const copy = COPY[locale];
  const { resolvedCount, totalCount, percentage } =
    computeResolutionFraction(incidents);

  const openPct =
    totalCount > 0 ? Math.round((incidents.open / totalCount) * 100) : 0;
  const invPct =
    totalCount > 0
      ? Math.round((incidents.investigating / totalCount) * 100)
      : 0;
  const resPct = Math.max(0, 100 - openPct - invPct);

  // Proportional flex weights for the 3-segment top progress bar
  const segResolved = Math.max(resolvedCount > 0 ? 18 : 0, resPct);
  const segInv = Math.max(incidents.investigating > 0 ? 14 : 0, invPct);
  const segOpen = Math.max(incidents.open > 0 ? 14 : 0, openPct);
  const segSum = segResolved + segInv + segOpen || 1;

  return (
    <div
      data-testid="bento-priority-column"
      className="flex flex-col gap-3 h-full"
    >
      {/* Top Resolution Progress Cap */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:shadow-none">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            {copy.resolutionTitle}
          </h3>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {percentage}%
          </span>
        </div>

        {/* 3-segment proportional progress bar */}
        <div className="mt-3 flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
          <span className="whitespace-nowrap">
            {copy.resolvedLbl} {resPct}%
          </span>
          <span className="whitespace-nowrap">
            {copy.activeLbl} {invPct}%
          </span>
          <span className="whitespace-nowrap">
            {copy.openLbl} {openPct}%
          </span>
        </div>
        <div className="mt-1.5 flex h-2.5 w-full gap-1 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {resPct > 0 && (
            <svg
              className="h-full rounded-full"
              width={`${(segResolved / segSum) * 100}%`}
              aria-hidden="true"
            >
              <rect
                width="100%"
                height="100%"
                rx="5"
                fill={isDark ? "#3b82f6" : "#0565d3"}
              />
            </svg>
          )}
          {invPct > 0 && (
            <svg
              className="h-full rounded-full"
              width={`${(segInv / segSum) * 100}%`}
              aria-hidden="true"
            >
              <rect
                width="100%"
                height="100%"
                rx="5"
                fill={isDark ? "#cbd5e1" : "#0f172a"}
              />
            </svg>
          )}
          {openPct > 0 && (
            <svg
              className="h-full rounded-full"
              width={`${(segOpen / segSum) * 100}%`}
              aria-hidden="true"
            >
              <rect width="100%" height="100%" rx="5" fill="#f97316" />
            </svg>
          )}
        </div>
      </section>

      {/* Dark High-Contrast Focal Card */}
      <section
        data-testid="bento-dark-queue-card"
        className="bg-slate-900 dark:bg-[#070C16] border border-transparent dark:border-slate-800 text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-[0_6px_20px_-6px_rgba(15,23,42,0.28)] dark:shadow-none"
      >
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-white">
              {copy.queueTitle}
            </h3>
            <span className="text-2xl font-light tracking-tight text-white tabular-nums">
              {resolvedCount}/{totalCount}
            </span>
          </div>

          <Link
            to="/corrective-actions"
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <ClipboardCheck
              className={`h-3.5 w-3.5 shrink-0 ${
                overdueActions > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            />
            <span className="tabular-nums">
              {overdueActions > 0
                ? `${overdueActions} ${
                    overdueActions === 1 ? copy.overdueSingle : copy.overduePlural
                  }`
                : copy.onTrack}
            </span>
          </Link>

          {/* Compact Recent Incidents List */}
          <div className="mt-4 divide-y divide-white/10">
            {recent.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                {copy.empty}
              </p>
            ) : (
              recent.slice(0, 4).map((item) => {
                const isDone =
                  item.status === "resolved" || item.status === "closed";
                const isCritical = item.severity === "critical" || item.severity === "high";
                return (
                  <Link
                    key={item.id}
                    to="/incidents/manage"
                    className="group flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-white/[0.04] -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        isDone
                          ? "bg-white/10 text-slate-300"
                          : isCritical
                            ? "bg-orange-500/20 text-orange-300"
                            : "bg-prosafe-500/20 text-prosafe-300"
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium truncate ${
                          isDone ? "text-slate-400 line-through" : "text-white"
                        }`}
                      >
                        <span className="font-mono tabular-nums">
                          {item.incidentId}
                        </span>
                        {" · "}
                        {t(`incidents.types.${item.type}`, {
                          defaultValue: item.type,
                        })}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 tabular-nums">
                        {item.zone || "Site"} ·{" "}
                        {new Date(item.timestamp).toLocaleDateString(
                          i18n.language
                        )}
                      </p>
                    </div>

                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle
                        className={`h-4 w-4 shrink-0 ${
                          isCritical ? "text-orange-400" : "text-slate-500"
                        }`}
                      />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <Link
            to="/incidents/manage"
            className="text-xs font-medium text-prosafe-300 hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            <span>{t("overview.viewAll", { defaultValue: copy.viewAll })}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <span className="text-[11px] text-slate-400 tabular-nums">
            {incidents.open + incidents.investigating} {copy.activeCountLbl}
          </span>
        </div>
      </section>
    </div>
  );
};

export default PriorityQueueCard;
