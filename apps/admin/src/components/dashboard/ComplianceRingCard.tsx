import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Clock } from "lucide-react";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import { fmtHours } from "./chartUtils";

type CompliancePillar = "equipment" | "training" | "audit";

interface ComplianceRingCardProps {
  equipmentRate: number | null;
  trainingRate: number | null;
  auditRate: number | null;
  meanResolutionHours: number | null;
}

const COPY = {
  fr: {
    title: "Conformité ISO 45001",
    subtitle: "Suivi en temps réel",
    avgResolution: "Délai moyen",
    openCompliance: "Ouvrir la conformité",
    pillars: {
      equipment: "Équip.",
      training: "Formations",
      audit: "Audits",
    },
  },
  en: {
    title: "ISO 45001 Compliance",
    subtitle: "Live compliance score",
    avgResolution: "Avg resolution",
    openCompliance: "Open compliance view",
    pillars: {
      equipment: "Equipment",
      training: "Training",
      audit: "Audits",
    },
  },
  ar: {
    title: "الامتثال لمعيار ISO 45001",
    subtitle: "معدل الامتثال المباشر",
    avgResolution: "متوسط الإغلاق",
    openCompliance: "فتح صفحة الامتثال",
    pillars: {
      equipment: "المعدات",
      training: "التدريب",
      audit: "التدقيق",
    },
  },
} as const;

const RADIUS = 66;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICK_COUNT = 36;

const ComplianceRingCard = ({
  equipmentRate,
  trainingRate,
  auditRate,
  meanResolutionHours,
}: ComplianceRingCardProps) => {
  const { t } = useTranslation();
  const locale = usePublicLocale();
  const copy = COPY[locale];
  const [pillar, setPillar] = useState<CompliancePillar>("equipment");

  const rates: Record<CompliancePillar, number | null> = {
    equipment: equipmentRate,
    training: trainingRate,
    audit: auditRate,
  };

  const activeRate = rates[pillar];
  const clamped = activeRate == null ? 0 : Math.max(0, Math.min(100, activeRate));
  const dashOffset = CIRCUMFERENCE * (1 - clamped / 100);
  const displayValue =
    activeRate == null ? "—" : `${Math.round(activeRate * 10) / 10}%`;

  const ringColor =
    activeRate == null
      ? "#94a3b8"
      : activeRate >= 85
        ? "#0565d3"
        : activeRate >= 70
          ? "#d97706"
          : "#dc2626";

  const ticks = Array.from({ length: TICK_COUNT }, (_, idx) => {
    const angle = (idx / TICK_COUNT) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const rOuter = 82;
    const rInner = idx % 3 === 0 ? 75 : 78;
    return {
      idx,
      x1: 92 + rInner * Math.cos(rad),
      y1: 92 + rInner * Math.sin(rad),
      x2: 92 + rOuter * Math.cos(rad),
      y2: 92 + rOuter * Math.sin(rad),
      major: idx % 3 === 0,
    };
  });

  return (
    <section
      data-testid="bento-compliance-card"
      className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
            {copy.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{copy.subtitle}</p>
        </div>
        <Link
          to="/compliance"
          aria-label={copy.openCompliance}
          className="h-8 w-8 rounded-full border border-slate-200 bg-slate-50/70 hover:bg-prosafe-50 hover:border-prosafe-200 hover:text-prosafe-700 text-slate-500 flex items-center justify-center transition-colors shrink-0"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Radial Gauge */}
      <div className="my-4 flex flex-col items-center justify-center">
        <div className="relative w-[184px] h-[184px] flex items-center justify-center">
          <svg
            viewBox="0 0 184 184"
            className="w-full h-full"
            role="img"
            aria-label={`${copy.pillars[pillar]}: ${displayValue}`}
          >
            {/* Outer Precision Ticks */}
            {ticks.map((tk) => (
              <line
                key={tk.idx}
                x1={tk.x1}
                y1={tk.y1}
                x2={tk.x2}
                y2={tk.y2}
                stroke={tk.major ? "#cbd5e1" : "#e2e8f0"}
                strokeWidth={tk.major ? 1.5 : 1}
                strokeLinecap="round"
              />
            ))}
            {/* Track Circle */}
            <circle
              cx="92"
              cy="92"
              r={RADIUS}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="10"
            />
            {/* Active Progress Arc */}
            <circle
              cx="92"
              cy="92"
              r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 92 92)"
              className="transition-[stroke-dashoffset] duration-300 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span
              data-testid="compliance-ring-value"
              className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums"
            >
              {displayValue}
            </span>
            <span className="text-xs font-medium text-slate-500 mt-0.5">
              {copy.pillars[pillar]}
            </span>
          </div>
        </div>

        {/* Mean resolution metadata line */}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{t("overview.kpi.meanResolution", { defaultValue: copy.avgResolution })}:</span>
          <span className="font-semibold text-slate-800">{fmtHours(meanResolutionHours)}</span>
        </div>
      </div>

      {/* Interactive Pillar Switcher */}
      <div
        role="group"
        aria-label={copy.title}
        className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100/90"
      >
        {(["equipment", "training", "audit"] as CompliancePillar[]).map((item) => {
          const active = pillar === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setPillar(item)}
              aria-pressed={active}
              data-testid={`compliance-pillar-${item}`}
              className={`min-w-0 truncate px-1.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-white text-prosafe-700 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {copy.pillars[item]}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ComplianceRingCard;
