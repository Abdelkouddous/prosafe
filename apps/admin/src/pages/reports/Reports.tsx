import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageShell from "@/components/PageShell";
import SafetyReportPdfModal from "@/components/SafetyReportPdfModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  CHART_COLORS,
  ChartCard,
  KpiCard,
  SEVERITY_COLORS,
  fmtHours,
  fmtRate,
} from "@/components/dashboard/chartUtils";
import {
  statsApi,
  type ForecastResult,
  type GroupCount,
  type StatsKpis,
} from "@/services/statsApi";
import {
  blobErrorMessage,
  reportsApi,
  type ReportFormat,
  type ReportKind,
} from "@/services/reportsApi";
import { INCIDENT_TYPES } from "@/services/incidentApi";

const ALL = "all";
type Preset = "30d" | "90d" | "12m" | "year" | "custom";

const iso = (d: Date) => d.toISOString().slice(0, 10);

const presetRange = (p: Preset): { from: string; to: string } | null => {
  const now = new Date();
  const to = iso(now);
  const back = (days: number) => iso(new Date(now.getTime() - days * 86400000));
  switch (p) {
    case "30d":
      return { from: back(30), to };
    case "90d":
      return { from: back(90), to };
    case "12m":
      return { from: back(365), to };
    case "year":
      return { from: `${now.getFullYear()}-01-01`, to };
    default:
      return null;
  }
};

const KINDS: ReportKind[] = ["incidents", "equipment", "trainings", "risks", "audits"];

const Reports = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [preset, setPreset] = useState<Preset>("12m");
  const [range, setRange] = useState(presetRange("12m")!);
  const [type, setType] = useState(ALL);
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<StatsKpis | null>(null);
  const [months, setMonths] = useState<GroupCount[]>([]);
  const [byType, setByType] = useState<GroupCount[]>([]);
  const [byZone, setByZone] = useState<GroupCount[]>([]);
  const [bySeverity, setBySeverity] = useState<GroupCount[]>([]);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const f = { from: range.from || undefined, to: range.to || undefined };
    try {
      const [k, m, ty, z, sv, fc] = await Promise.all([
        statsApi.kpis(f),
        statsApi.incidents("month", f),
        statsApi.incidents("type", f),
        statsApi.incidents("zone", f),
        statsApi.incidents("severity", f),
        statsApi.forecast(3),
      ]);
      setKpis(k.data);
      setMonths(m.data);
      setByType(ty.data);
      setByZone(z.data.slice(0, 8));
      setBySeverity(sv.data);
      setForecast(fc.data);
    } catch {
      toast({ title: t("reports.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const choosePreset = (p: Preset) => {
    setPreset(p);
    const r = presetRange(p);
    if (r) setRange(r);
  };

  // Actual per month + forecast (dashed), anchored on the last historical month.
  const trend = useMemo(() => {
    const rows = new Map<string, { month: string; actual?: number; forecast?: number }>();
    months.forEach((m) => rows.set(m.key, { month: m.key, actual: m.count }));
    if (forecast) {
      const last = forecast.history[forecast.history.length - 1];
      if (last) {
        const r = rows.get(last.month) ?? { month: last.month, actual: last.count };
        r.forecast = last.count;
        rows.set(last.month, r);
      }
      forecast.forecast.forEach((f) =>
        rows.set(f.month, { month: f.month, forecast: f.count })
      );
    }
    return [...rows.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [months, forecast]);

  const method = forecast?.forecast[0]?.method;

  const download = async (kind: ReportKind, format: ReportFormat) => {
    const key = `${kind}-${format}`;
    setBusy(key);
    try {
      await reportsApi.download(kind, format, {
        from: range.from,
        to: range.to,
        type: kind === "incidents" && type !== ALL ? type : undefined,
        department: department.trim() || undefined,
      });
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg = await blobErrorMessage(e);
      toast({
        title:
          status === 400
            ? t("reports.unavailable")
            : t("reports.downloadError"),
        description: msg,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <PageShell
      title={t("reports.title")}
      subtitle={t("reports.subtitle")}
      actions={
        <Button
          onClick={() => setPdfOpen(true)}
          data-testid="reports-pdf-btn"
          className="bg-prosafe-600 hover:bg-prosafe-700 whitespace-nowrap shrink-0"
        >
          <FileText className="h-4 w-4 me-2" />
          PDF ISO 45001
        </Button>
      }
    >
      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {(["30d", "90d", "12m", "year", "custom"] as Preset[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={preset === p ? "default" : "outline"}
                onClick={() => choosePreset(p)}
              >
                {t(`reports.presets.${p}`)}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>{t("incidents.from")}</Label>
              <Input
                type="date"
                value={range.from}
                onChange={(e) => {
                  setPreset("custom");
                  setRange((r) => ({ ...r, from: e.target.value }));
                }}
              />
            </div>
            <div>
              <Label>{t("incidents.to")}</Label>
              <Input
                type="date"
                value={range.to}
                onChange={(e) => {
                  setPreset("custom");
                  setRange((r) => ({ ...r, to: e.target.value }));
                }}
              />
            </div>
            <div>
              <Label>{t("incidents.type")}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("incidents.allTypes")}</SelectItem>
                  {INCIDENT_TYPES.map((ty) => (
                    <SelectItem key={ty} value={ty}>
                      {t(`incidents.types.${ty}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("incidents.department")}</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={t("reports.allDepartments")}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">{t("reports.filtersNote")}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("reports.download")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {KINDS.map((kind) => (
              <div key={kind} className="rounded-lg border p-3">
                <div className="mb-2 text-sm font-medium">{t(`reports.kinds.${kind}`)}</div>
                <div className="flex gap-2">
                  {(["pdf", "xlsx"] as ReportFormat[]).map((fmt) => (
                    <Button
                      key={fmt}
                      size="sm"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => download(kind, fmt)}
                    >
                      {busy === `${kind}-${fmt}` ? (
                        <Loader2 className="me-1 h-4 w-4 animate-spin" />
                      ) : fmt === "pdf" ? (
                        <FileText className="me-1 h-4 w-4" />
                      ) : (
                        <FileSpreadsheet className="me-1 h-4 w-4" />
                      )}
                      {fmt === "pdf" ? "PDF" : "Excel"}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {kpis && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              <KpiCard
                label={t("reports.kpi.incidents")}
                value={kpis.incidentsPerMonth.reduce((s, m) => s + m.count, 0)}
              />
              <KpiCard label={t("overview.kpi.meanResolution")} value={fmtHours(kpis.meanResolutionHours)} />
              <KpiCard label={t("overview.kpi.equipmentCompliance")} value={fmtRate(kpis.equipmentComplianceRate)} tone="success" />
              <KpiCard label={t("overview.kpi.trainingCompliance")} value={fmtRate(kpis.trainingComplianceRate)} tone="success" />
              <KpiCard label={t("overview.kpi.auditCompliance")} value={fmtRate(kpis.auditComplianceRate)} tone="success" />
              <KpiCard
                label={t("overview.kpi.actionsOverdue")}
                value={kpis.correctiveActionsOverdue}
                tone={kpis.correctiveActionsOverdue > 0 ? "danger" : "success"}
              />
            </div>
          )}

          <ChartCard
            title={`${t("reports.charts.trend")}${
              method ? ` (${t(`reports.methods.${method}`)})` : ""
            }`}
            empty={trend.length === 0 ? t("overview.noData") : undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name={t("reports.charts.actual")}
                  stroke="#F97316"
                  strokeWidth={2}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name={t("reports.charts.forecast")}
                  stroke="#0565d3"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartCard
              title={t("overview.charts.byType")}
              empty={byType.length === 0 ? t("overview.noData") : undefined}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType.map((r) => ({
                      name: t(`incidents.types.${r.key}`, { defaultValue: r.key }),
                      value: r.count,
                    }))}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {byType.map((_, i) => (
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
              empty={byZone.length === 0 ? t("overview.noData") : undefined}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byZone.map((r) => ({ name: r.key || t("overview.noZone"), count: r.count }))}
                  layout="vertical"
                  margin={{ left: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0565d3" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t("reports.charts.bySeverity")}
              empty={bySeverity.length === 0 ? t("overview.noData") : undefined}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bySeverity.map((r) => ({
                    key: r.key,
                    name: t(`incidents.severities.${r.key}`, { defaultValue: r.key }),
                    count: r.count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {bySeverity.map((r) => (
                      <Cell key={r.key} fill={SEVERITY_COLORS[r.key] ?? "#6B7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}
      <SafetyReportPdfModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        periodLabel={range.from && range.to ? `${range.from} → ${range.to}` : undefined}
      />
    </PageShell>
  );
};

export default Reports;
