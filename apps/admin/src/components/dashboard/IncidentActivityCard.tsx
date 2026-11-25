import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import { computeMonthlySeries } from "@/lib/dashboardMetrics";

interface IncidentActivityCardProps {
  incidentsPerMonth: { month: string; count: number }[];
  totalIncidents: number;
  openCount: number;
}

const COPY = {
  fr: {
    title: "Activité incidents",
    unit: "déclarations suivies",
    openLabel: "en cours de traitement",
    openReports: "Voir les rapports détaillés",
    peakUnit: "pic",
    empty: "Aucune donnée mensuelle disponible.",
  },
  en: {
    title: "Incident Activity",
    unit: "tracked reports",
    openLabel: "currently active",
    openReports: "View detailed reports",
    peakUnit: "peak",
    empty: "No monthly incident data yet.",
  },
  ar: {
    title: "نشاط الحوادث",
    unit: "بلاغات متابعة",
    openLabel: "قيد المعالجة حالياً",
    openReports: "عرض التقارير التفصيلية",
    peakUnit: "الذروة",
    empty: "لا توجد بيانات شهرية حالياً.",
  },
} as const;

const MONTH_SHORT_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MONTH_SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonthShort(ym: string, locale: "fr" | "en" | "ar"): string {
  const parts = ym.split("-");
  if (parts.length >= 2) {
    const idx = Number(parts[1]) - 1;
    if (idx >= 0 && idx < 12) {
      if (locale === "fr") return MONTH_SHORT_FR[idx];
      if (locale === "en") return MONTH_SHORT_EN[idx];
      return parts[1];
    }
  }
  return ym.slice(0, 3);
}

const IncidentActivityCard = ({
  incidentsPerMonth,
  totalIncidents,
  openCount,
}: IncidentActivityCardProps) => {
  const { t } = useTranslation();
  const locale = usePublicLocale();
  const copy = COPY[locale];
  const bars = computeMonthlySeries(incidentsPerMonth, 7);

  return (
    <section
      data-testid="bento-activity-card"
      className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
            {t("overview.charts.perMonth", { defaultValue: copy.title })}
          </h3>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalIncidents}
            </span>
            <span className="text-xs text-slate-500 leading-tight">
              {copy.unit}
              <span className="block text-slate-400 tabular-nums">
                {openCount} {copy.openLabel}
              </span>
            </span>
          </div>
        </div>
        <Link
          to="/reports"
          aria-label={copy.openReports}
          className="h-8 w-8 rounded-full border border-slate-200 bg-slate-50/70 hover:bg-prosafe-50 hover:border-prosafe-200 hover:text-prosafe-700 text-slate-500 flex items-center justify-center transition-colors shrink-0"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Rounded Vertical Pill-Bar Chart (SVG for crisp proportional geometry) */}
      <div className="mt-5 flex-1 flex flex-col justify-end min-h-[172px]">
        {bars.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            {copy.empty}
          </div>
        ) : (
          <div className="w-full">
            <svg
              viewBox={`0 0 ${bars.length * 46} 156`}
              className="w-full h-[156px] overflow-visible"
              role="img"
              aria-label={copy.title}
            >
              {bars.map((bar, idx) => {
                const cx = idx * 46 + 23;
                const maxBarH = 92;
                const barH = Math.max(10, Math.round((bar.heightPct / 100) * maxBarH));
                const barY = 122 - barH;
                const label = formatMonthShort(bar.month, locale);

                return (
                  <g key={bar.month}>
                    {/* Subtle vertical track rail */}
                    <line
                      x1={cx}
                      y1={30}
                      x2={cx}
                      y2={122}
                      stroke="#f1f5f9"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    {/* Peak floating callout tag */}
                    {bar.isPeak && (
                      <g>
                        <rect
                          x={cx - 18}
                          y={Math.max(0, barY - 26)}
                          width="36"
                          height="19"
                          rx="9.5"
                          fill="#0565d3"
                        />
                        <text
                          x={cx}
                          y={Math.max(13, barY - 13)}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="600"
                          className="tabular-nums"
                        >
                          {bar.count}
                        </text>
                      </g>
                    )}
                    {/* Rounded vertical bar */}
                    <rect
                      x={cx - 5}
                      y={barY}
                      width="10"
                      height={barH}
                      rx="5"
                      fill={bar.isPeak ? "#0565d3" : "#0f172a"}
                    />
                    {/* Baseline anchor point */}
                    <circle
                      cx={cx}
                      cy={132}
                      r="2.5"
                      fill={bar.isPeak ? "#0565d3" : "#94a3b8"}
                    />
                    {/* Month Label */}
                    <text
                      x={cx}
                      y={150}
                      textAnchor="middle"
                      fill={bar.isPeak ? "#0f172a" : "#64748b"}
                      fontSize="10.5"
                      fontWeight={bar.isPeak ? "600" : "500"}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </section>
  );
};

export default IncidentActivityCard;
