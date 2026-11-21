import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Loader2,
  Plus,
  ShieldAlert,
  Wrench,
  GraduationCap,
  Package,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  statsApi,
  type GroupCount,
  type StatsKpis,
  type StatsOverview,
} from "@/services/statsApi";
import { incidentApi, type Incident } from "@/services/incidentApi";
import { severityClasses, statusClasses } from "@/components/incidents/incidentUi";
import {
  CHART_COLORS,
  ChartCard,
  KpiCard,
  STATUS_COLORS,
  fmtHours,
  fmtRate,
} from "./chartUtils";

interface Data {
  overview: StatsOverview;
  kpis: StatsKpis;
  byType: GroupCount[];
  byZone: GroupCount[];
  byStatus: GroupCount[];
  recent: Incident[];
}

const Overview = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [overview, kpis, byType, byZone, byStatus, recent] = await Promise.all([
          statsApi.overview(),
          statsApi.kpis(),
          statsApi.incidents("type"),
          statsApi.incidents("zone"),
          statsApi.incidents("status"),
          incidentApi.list({ page: 1, limit: 5 }),
        ]);
        if (!alive) return;
        setData({
          overview: overview.data,
          kpis: kpis.data,
          byType: byType.data,
          byZone: byZone.data.slice(0, 8),
          byStatus: byStatus.data,
          recent: recent.data.data,
        });
      } catch {
        if (alive) toast({ title: t("overview.loadError"), variant: "destructive" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
      </div>
    );
  }
  if (!data) return <p className="py-10 text-center text-gray-500">{t("overview.loadError")}</p>;

  const { overview: o, kpis: k } = data;
  const typeLabel = (key: string) => t(`incidents.types.${key}`, { defaultValue: key });
  const statusLabel = (key: string) => t(`incidents.statuses.${key}`, { defaultValue: key });
  const zoneLabel = (key: string) => key || t("overview.noZone");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link to="/incidents">
            <Plus className="me-2 h-4 w-4" />
            {t("overview.quick.report")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/risks">
            <ShieldAlert className="me-2 h-4 w-4" />
            {t("overview.quick.risks")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/reports">
            <BarChart3 className="me-2 h-4 w-4" />
            {t("overview.quick.reports")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("overview.kpi.total")} value={o.incidents.total} />
        <KpiCard label={t("overview.kpi.open")} value={o.incidents.open} tone="warning" />
        <KpiCard
          label={t("overview.kpi.investigating")}
          value={o.incidents.investigating}
        />
        <KpiCard
          label={t("overview.kpi.resolved")}
          value={o.incidents.resolved}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        />
        <KpiCard
          label={t("overview.kpi.criticalOpen")}
          value={o.criticalOpen}
          tone={o.criticalOpen > 0 ? "danger" : "default"}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        />
        <Link to="/alerts" className="block">
          <KpiCard
            label={t("overview.kpi.activeAlerts")}
            value={o.activeAlerts}
            tone={o.activeAlerts > 0 ? "danger" : "default"}
            icon={<Bell className="h-4 w-4 text-orange-500" />}
          />
        </Link>
        <KpiCard
          label={t("overview.kpi.meanResolution")}
          value={fmtHours(k.meanResolutionHours)}
          icon={<Clock className="h-4 w-4 text-gray-400" />}
        />
        <Link to="/corrective-actions" className="block">
          <KpiCard
            label={t("overview.kpi.actionsOverdue")}
            value={k.correctiveActionsOverdue}
            tone={k.correctiveActionsOverdue > 0 ? "danger" : "success"}
            icon={<ClipboardCheck className="h-4 w-4 text-gray-400" />}
          />
        </Link>
        <KpiCard
          label={t("overview.kpi.equipmentCompliance")}
          value={fmtRate(k.equipmentComplianceRate)}
          tone="success"
        />
        <KpiCard
          label={t("overview.kpi.trainingCompliance")}
          value={fmtRate(k.trainingComplianceRate)}
          tone="success"
        />
        <KpiCard
          label={t("overview.kpi.lowStock")}
          value={o.lowStock}
          tone={o.lowStock > 0 ? "warning" : "default"}
          icon={<Package className="h-4 w-4 text-gray-400" />}
        />
        <KpiCard
          label={t("overview.kpi.overdueMaintenance")}
          value={o.overdueMaintenance}
          tone={o.overdueMaintenance > 0 ? "warning" : "default"}
          icon={<Wrench className="h-4 w-4 text-gray-400" />}
        />
        <KpiCard
          label={t("overview.kpi.expiringTrainings")}
          value={o.expiringTrainings}
          tone={o.expiringTrainings > 0 ? "warning" : "default"}
          icon={<GraduationCap className="h-4 w-4 text-gray-400" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title={t("overview.charts.perMonth")}
          empty={k.incidentsPerMonth.length === 0 ? t("overview.noData") : undefined}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={k.incidentsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name={t("overview.kpi.total")} fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t("overview.charts.byType")}
          empty={data.byType.length === 0 ? t("overview.noData") : undefined}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.byType.map((r) => ({ name: typeLabel(r.key), value: r.count }))}
                dataKey="value"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {data.byType.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t("overview.charts.byZone")}
          empty={data.byZone.length === 0 ? t("overview.noData") : undefined}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.byZone.map((r) => ({ name: zoneLabel(r.key), count: r.count }))}
              layout="vertical"
              margin={{ left: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} />
              <Tooltip />
              <Bar dataKey="count" name={t("overview.kpi.total")} fill="#0565d3" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t("overview.charts.byStatus")}
          empty={data.byStatus.length === 0 ? t("overview.noData") : undefined}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byStatus.map((r) => ({ key: r.key, name: statusLabel(r.key), count: r.count }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name={t("overview.kpi.total")} radius={[4, 4, 0, 0]}>
                {data.byStatus.map((r) => (
                  <Cell key={r.key} fill={STATUS_COLORS[r.key] ?? "#6B7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("overview.recent")}</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/incidents/manage">{t("overview.viewAll")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">{t("incidents.empty")}</p>
          ) : (
            <ul className="divide-y">
              {data.recent.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {i.incidentId} · {typeLabel(i.type)}
                    </div>
                    <div className="max-w-md truncate text-xs text-gray-500">{i.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={severityClasses[i.severity]}>
                      {t(`incidents.severities.${i.severity}`)}
                    </Badge>
                    <Badge className={statusClasses[i.status]}>
                      {t(`incidents.statuses.${i.status}`)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(i.timestamp).toLocaleDateString(i18n.language)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
