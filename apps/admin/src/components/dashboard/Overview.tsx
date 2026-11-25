import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  GraduationCap,
  Loader2,
  Package,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import {
  computeOverallCompliance,
  computePipelineSegments,
} from "@/lib/dashboardMetrics";
import {
  statsApi,
  type GroupCount,
  type StatsKpis,
  type StatsOverview,
} from "@/services/statsApi";
import { incidentApi, type Incident } from "@/services/incidentApi";
import { CHART_COLORS, ChartCard } from "./chartUtils";
import ComplianceRingCard from "./ComplianceRingCard";
import IncidentActivityCard from "./IncidentActivityCard";
import PriorityQueueCard from "./PriorityQueueCard";

interface Data {
  overview: StatsOverview;
  kpis: StatsKpis;
  byType: GroupCount[];
  byZone: GroupCount[];
  recent: Incident[];
}

const COPY = {
  fr: {
    greeting: "Bon retour",
    roleLead: "Direction HSE / SST",
    postureNominal: "Situation nominale",
    postureCritical: "critique(s) ouvert(s)",
    heroIncidents: "Incidents",
    heroAlerts: "Alertes actives",
    heroCompliance: "Conformité ISO",
    lowStock: "Stock bas EPI",
    overdueMaint: "Maintenances en retard",
    expiringTrain: "Formations à renouveler",
    pipeline: {
      open: "Ouverts",
      investigating: "Analyse",
      resolved: "Résolus",
      closed: "Clôturés",
    },
  },
  en: {
    greeting: "Welcome back",
    roleLead: "HSE / OHS Command",
    postureNominal: "Site status nominal",
    postureCritical: "critical open",
    heroIncidents: "Incidents",
    heroAlerts: "Active Alerts",
    heroCompliance: "ISO Compliance",
    lowStock: "Low Stock PPE",
    overdueMaint: "Overdue Maintenance",
    expiringTrain: "Expiring Trainings",
    pipeline: {
      open: "Open",
      investigating: "Investigating",
      resolved: "Resolved",
      closed: "Closed",
    },
  },
  ar: {
    greeting: "مرحباً بعودتك",
    roleLead: "إدارة السلامة HSE",
    postureNominal: "الوضع الميداني مستقر",
    postureCritical: "حوادث حرجة مفتوحة",
    heroIncidents: "الحوادث",
    heroAlerts: "التنبيهات النشطة",
    heroCompliance: "امتثال ISO",
    lowStock: "مخزون منخفض",
    overdueMaint: "صيانة متأخرة",
    expiringTrain: "تدريبات منتهية قريباً",
    pipeline: {
      open: "مفتوحة",
      investigating: "قيد التحليل",
      resolved: "محلولة",
      closed: "مغلقة",
    },
  },
} as const;

const Overview = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const locale = usePublicLocale();
  const copy = COPY[locale];
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const tooltipStyle = isDark
    ? {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        color: "#f8fafc",
        borderRadius: "0.75rem",
      }
    : {
        backgroundColor: "#ffffff",
        borderColor: "#e2e8f0",
        color: "#0f172a",
        borderRadius: "0.75rem",
      };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [overview, kpis, byType, byZone, recent] = await Promise.all([
          statsApi.overview(),
          statsApi.kpis(),
          statsApi.incidents("type"),
          statsApi.incidents("zone"),
          incidentApi.list({ page: 1, limit: 5 }),
        ]);
        if (!alive) return;
        setData({
          overview: overview.data,
          kpis: kpis.data,
          byType: byType.data,
          byZone: byZone.data.slice(0, 8),
          recent: recent.data.data,
        });
      } catch {
        if (alive)
          toast({ title: t("overview.loadError"), variant: "destructive" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pieData = useMemo(
    () =>
      (data?.byType ?? []).map((r) => ({
        name: t(`incidents.types.${r.key}`, { defaultValue: r.key }),
        value: r.count,
      })),
    [data?.byType, t]
  );

  const barData = useMemo(
    () =>
      (data?.byZone ?? []).map((r) => ({
        name: r.key || t("overview.noZone"),
        count: r.count,
      })),
    [data?.byZone, t]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
      </div>
    );
  }
  if (!data) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        {t("overview.loadError")}
      </p>
    );
  }

  const { overview: o, kpis: k } = data;

  const pipeline = computePipelineSegments(o.incidents);
  const overallCompliance = computeOverallCompliance(k);
  const openAndInvestigating = o.incidents.open + o.incidents.investigating;

  const initials =
    `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase() ||
    "HS";
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "HSE Manager";

  // Proportional flex weights for the top executive pipeline strip
  const pipelineWeights = pipeline.map((seg) => ({
    ...seg,
    flexBasisPct: Math.max(seg.pct, seg.count > 0 ? 14 : 10),
  }));
  const totalWeight =
    pipelineWeights.reduce((acc, s) => acc + s.flexBasisPct, 0) || 100;

  return (
    <div className="space-y-6" data-testid="bento-dashboard-overview">
      {/* Row 0: Executive Header Strip (Greeting + Pipeline Distribution Bar + 3 Borderless Hero Metrics) */}
      <section
        data-testid="executive-header-strip"
        className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2"
      >
        <div className="flex-1 min-w-0 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {copy.greeting}
            {user?.firstName ? `, ${user.firstName}` : ""}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("adminDashboard.dashboard_description")}
          </p>

          {/* Horizontal Segmented Incident Pipeline Bar */}
          <div className="mt-5" data-testid="incident-pipeline-bar">
            <div className="flex items-end gap-2 w-full">
              {pipelineWeights.map((seg) => {
                const widthPct = `${(seg.flexBasisPct / totalWeight) * 100}%`;
                const barStyle =
                  seg.key === "open"
                    ? "bg-orange-500 text-white"
                    : seg.key === "investigating"
                      ? "bg-prosafe-600 dark:bg-prosafe-500 text-white"
                      : seg.key === "resolved"
                        ? "bg-[repeating-linear-gradient(-45deg,#f8fafc,#f8fafc_5px,#e2e8f0_5px,#e2e8f0_10px)] dark:bg-[repeating-linear-gradient(-45deg,#0f172a,#0f172a_5px,#1e293b_5px,#1e293b_10px)] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700";

                return (
                  <div
                    key={seg.key}
                    className="min-w-[66px] flex flex-col gap-1.5"
                    style={{ width: widthPct }}
                  >
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate px-1">
                      {copy.pipeline[seg.key]}
                    </span>
                    <div
                      className={`h-9 rounded-full px-3 flex items-center justify-between text-xs font-semibold tabular-nums transition-colors ${barStyle}`}
                    >
                      <span>{seg.pct}%</span>
                      <span className="hidden sm:inline opacity-80 text-[11px]">
                        {seg.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3 Oversized Borderless Hero Figures */}
        <div
          data-testid="executive-hero-figures"
          className="flex flex-wrap items-end gap-7 sm:gap-10 shrink-0"
        >
          <Link to="/incidents/manage" className="group block">
            <div className="flex items-baseline gap-2">
              <AlertTriangle className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-prosafe-600 dark:group-hover:text-prosafe-400 transition-colors" />
              <span className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900 dark:text-white tabular-nums">
                {o.incidents.total}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {copy.heroIncidents}
            </p>
          </Link>

          <Link to="/alerts" className="group block">
            <div className="flex items-baseline gap-2">
              <Bell
                className={`h-4 w-4 transition-colors ${
                  o.activeAlerts > 0
                    ? "text-orange-500 dark:text-orange-400"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-prosafe-600 dark:group-hover:text-prosafe-400"
                }`}
              />
              <span className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900 dark:text-white tabular-nums">
                {o.activeAlerts}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {copy.heroAlerts}
            </p>
          </Link>

          <Link to="/compliance" className="group block">
            <div className="flex items-baseline gap-2">
              <ShieldCheck className="h-4 w-4 text-prosafe-600 dark:text-prosafe-400" />
              <span className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900 dark:text-white tabular-nums">
                {overallCompliance !== null
                  ? `${Math.round(overallCompliance)}%`
                  : "—"}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {copy.heroCompliance}
            </p>
          </Link>
        </div>
      </section>

      {/* Row 1: 4-Column Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5 items-stretch">
        {/* Col 1: HSE Command Spotlight Card (PROSAFE Navy Signature) */}
        <section
          data-testid="bento-spotlight-card"
          className="xl:col-span-3 rounded-2xl bg-gradient-to-br from-prosafe-950 via-prosafe-900 to-prosafe-800 border border-transparent dark:border-prosafe-700/40 text-white p-5 flex flex-col justify-between shadow-[0_6px_20px_-6px_rgba(5,101,211,0.32)] dark:shadow-none"
        >
          <div>
            {/* Manager Identity */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-base font-bold tracking-tight text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-prosafe-200 truncate">
                  {user?.department || copy.roleLead}
                </p>
              </div>
            </div>

            {/* Site Posture Readout */}
            <div className="mt-5 rounded-xl bg-white/[0.08] border border-white/10 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-prosafe-100">
                  {o.criticalOpen > 0
                    ? `${o.criticalOpen} ${copy.postureCritical}`
                    : copy.postureNominal}
                </span>
                <span
                  className={`text-xs font-mono font-semibold tabular-nums ${
                    o.criticalOpen > 0 ? "text-orange-300" : "text-emerald-300"
                  }`}
                >
                  {o.criticalOpen > 0 ? "ALERT" : "OK"}
                </span>
              </div>
            </div>

            {/* Operational Watch Rows (preserves Low Stock, Maintenance, Trainings) */}
            <div className="mt-4 divide-y divide-white/10 text-xs">
              <Link
                to="/equipment"
                className="flex items-center justify-between py-2.5 text-prosafe-100 hover:text-white transition-colors"
              >
                <span className="inline-flex items-center gap-2 min-w-0 truncate">
                  <Package className="h-3.5 w-3.5 text-prosafe-300 shrink-0" />
                  <span className="truncate">{copy.lowStock}</span>
                </span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    o.lowStock > 0 ? "text-amber-300" : "text-white"
                  }`}
                >
                  {o.lowStock}
                </span>
              </Link>
              <Link
                to="/equipment"
                className="flex items-center justify-between py-2.5 text-prosafe-100 hover:text-white transition-colors"
              >
                <span className="inline-flex items-center gap-2 min-w-0 truncate">
                  <Wrench className="h-3.5 w-3.5 text-prosafe-300 shrink-0" />
                  <span className="truncate">{copy.overdueMaint}</span>
                </span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    o.overdueMaintenance > 0 ? "text-amber-300" : "text-white"
                  }`}
                >
                  {o.overdueMaintenance}
                </span>
              </Link>
              <Link
                to="/trainings"
                className="flex items-center justify-between py-2.5 text-prosafe-100 hover:text-white transition-colors"
              >
                <span className="inline-flex items-center gap-2 min-w-0 truncate">
                  <GraduationCap className="h-3.5 w-3.5 text-prosafe-300 shrink-0" />
                  <span className="truncate">{copy.expiringTrain}</span>
                </span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    o.expiringTrainings > 0 ? "text-amber-300" : "text-white"
                  }`}
                >
                  {o.expiringTrainings}
                </span>
              </Link>
            </div>
          </div>

          {/* Primary Action & Quick Links */}
          <div className="mt-5 space-y-2.5">
            <Button
              asChild
              className="w-full bg-white text-prosafe-950 hover:bg-prosafe-50 font-semibold rounded-xl shadow-sm"
            >
              <Link to="/incidents">
                <Plus className="me-2 h-4 w-4" />
                {t("overview.quick.report")}
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/risks"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-medium text-white transition-colors whitespace-nowrap"
              >
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>{t("overview.quick.risks")}</span>
              </Link>
              <Link
                to="/reports"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-medium text-white transition-colors whitespace-nowrap"
              >
                <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                <span>{t("overview.quick.reports")}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Col 2: Monthly Incident Activity Bar Card */}
        <div className="xl:col-span-3 flex flex-col [&>*]:flex-1">
          <IncidentActivityCard
            incidentsPerMonth={k.incidentsPerMonth}
            totalIncidents={o.incidents.total}
            openCount={openAndInvestigating}
          />
        </div>

        {/* Col 3: Interactive ISO 45001 Radial Compliance Ring */}
        <div className="xl:col-span-3 flex flex-col [&>*]:flex-1">
          <ComplianceRingCard
            equipmentRate={k.equipmentComplianceRate}
            trainingRate={k.trainingComplianceRate}
            auditRate={k.auditComplianceRate}
            meanResolutionHours={k.meanResolutionHours}
          />
        </div>

        {/* Col 4: Resolution Progress + Dark Priority Queue Focal Card */}
        <div className="xl:col-span-3">
          <PriorityQueueCard
            incidents={o.incidents}
            overdueActions={k.correctiveActionsOverdue}
            recent={data.recent}
          />
        </div>
      </div>

      {/* Row 2: Secondary Analytical Breakdown (By Type & By Zone) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title={t("overview.charts.byType")}
          empty={data.byType.length === 0 ? t("overview.noData") : undefined}
          className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:shadow-none"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={56}
                outerRadius={86}
                paddingAngle={3}
                stroke={isDark ? "#0f172a" : "#ffffff"}
                isAnimationActive={false}
              >
                {pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: isDark ? "#cbd5e1" : "#475569", fontWeight: 600 }}
                itemStyle={{ color: isDark ? "#f8fafc" : "#0f172a" }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                formatter={(value) => (
                  <span className="text-slate-600 dark:text-slate-300">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t("overview.charts.byZone")}
          empty={data.byZone.length === 0 ? t("overview.noData") : undefined}
          className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:shadow-none"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ left: 16 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#1e293b" : "#e2e8f0"}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                axisLine={{ stroke: isDark ? "#334155" : "#cbd5e1" }}
                tickLine={{ stroke: isDark ? "#334155" : "#cbd5e1" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: isDark ? "#cbd5e1" : "#475569", fontSize: 12 }}
                axisLine={{ stroke: isDark ? "#334155" : "#cbd5e1" }}
                tickLine={{ stroke: isDark ? "#334155" : "#cbd5e1" }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: isDark ? "#cbd5e1" : "#475569", fontWeight: 600 }}
                itemStyle={{ color: isDark ? "#f8fafc" : "#0f172a" }}
                cursor={{ fill: isDark ? "rgba(51,65,85,0.35)" : "rgba(241,245,249,0.7)" }}
              />
              <Bar
                dataKey="count"
                name={t("overview.kpi.total")}
                fill={isDark ? "#3b82f6" : "#0565d3"}
                radius={[0, 6, 6, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Overview;
