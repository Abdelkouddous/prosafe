import { useEffect, useState } from "react";
import { Download, FileText, Loader2, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import { statsApi } from "@/services/statsApi";
import { incidentApi, type Incident } from "@/services/incidentApi";
import {
  buildSafetyReportHtml,
  type SafetyReportPayload,
} from "@/lib/workspaceFeatures";

interface SafetyReportPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodLabel?: string;
  initialIncidents?: Incident[];
}

const COPY = {
  fr: {
    dialogTitle: "Rapport de synthèse SST · ISO 45001",
    dialogDesc:
      "Aperçu prêt à imprimer ou enregistrer en PDF avec indicateurs clés et registre d'incidents.",
    printBtn: "Imprimer / Enregistrer en PDF",
    downloadBtn: "Télécharger (.html)",
    loading: "Préparation du rapport ISO 45001...",
    totalIncidents: "Total incidents",
    openIncidents: "Incidents ouverts",
    resolutionRate: "Taux de résolution",
    avgResolution: "Délai moyen",
    trainingCompliance: "Conformité formations",
    overdueActions: "Actions en retard",
    recentRegister: "Registre des incidents inclus",
    empty: "Aucun incident enregistré sur cette période.",
    colId: "Référence",
    colType: "Type",
    colSeverity: "Gravité",
    colStatus: "Statut",
    colZone: "Zone",
  },
  en: {
    dialogTitle: "ISO 45001 Executive Safety Report",
    dialogDesc:
      "Print-ready PDF summary combining live OHS KPIs, compliance rate, and incident register.",
    printBtn: "Print / Save as PDF",
    downloadBtn: "Download (.html)",
    loading: "Preparing ISO 45001 report...",
    totalIncidents: "Total Incidents",
    openIncidents: "Open Incidents",
    resolutionRate: "Resolution Rate",
    avgResolution: "Avg Resolution",
    trainingCompliance: "Training Compliance",
    overdueActions: "Overdue Actions",
    recentRegister: "Included Incident Register",
    empty: "No incidents recorded for this reporting period.",
    colId: "Reference",
    colType: "Type",
    colSeverity: "Severity",
    colStatus: "Status",
    colZone: "Zone",
  },
  ar: {
    dialogTitle: "تقرير السلامة التنفيذي · ISO 45001",
    dialogDesc:
      "معاينة جاهزة للطباعة أو الحفظ بصيغة PDF تتضمن مؤشرات الأداء وسجل الحوادث.",
    printBtn: "طباعة / حفظ كـ PDF",
    downloadBtn: "تحميل (.html)",
    loading: "جارٍ إعداد تقرير ISO 45001...",
    totalIncidents: "إجمالي الحوادث",
    openIncidents: "الحوادث المفتوحة",
    resolutionRate: "معدل المعالجة",
    avgResolution: "متوسط الإغلاق",
    trainingCompliance: "امتثال التدريب",
    overdueActions: "إجراءات متأخرة",
    recentRegister: "سجل الحوادث المشمول",
    empty: "لا توجد حوادث مسجلة خلال هذه الفترة.",
    colId: "المرجع",
    colType: "النوع",
    colSeverity: "الخطورة",
    colStatus: "الحالة",
    colZone: "المنطقة",
  },
} as const;

const SafetyReportPdfModal = ({
  open,
  onOpenChange,
  periodLabel,
  initialIncidents,
}: SafetyReportPdfModalProps) => {
  const locale = usePublicLocale();
  const copy = COPY[locale];
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<SafetyReportPayload | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);

    Promise.allSettled([
      statsApi.overview(),
      statsApi.kpis({}),
      initialIncidents && initialIncidents.length > 0
        ? Promise.resolve({ data: { data: initialIncidents } })
        : incidentApi.list({ page: 1, limit: 20 }),
    ]).then(([overviewRes, kpisRes, incidentsRes]) => {
      if (!active) return;
      const ov = overviewRes.status === "fulfilled" ? overviewRes.value.data : null;
      const kpi = kpisRes.status === "fulfilled" ? kpisRes.value.data : null;
      const rows =
        incidentsRes.status === "fulfilled" ? incidentsRes.value.data.data ?? [] : [];

      const openCount =
        (ov?.incidents?.open ?? 0) + (ov?.incidents?.investigating ?? 0);
      const resolvedCount =
        (ov?.incidents?.resolved ?? 0) + (ov?.incidents?.closed ?? 0);
      const totalCount = ov?.incidents?.total ?? rows.length;
      const resolutionRatePct =
        totalCount > 0
          ? Math.round(((resolvedCount || Math.max(0, totalCount - openCount)) / totalCount) * 100)
          : null;
      const generatedBy =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.email ||
        "HSE Manager";

      setPayload({
        title: copy.dialogTitle,
        organization: "PROSAFE Industrial Operations",
        generatedBy,
        generatedAtIso: new Date().toISOString(),
        periodLabel:
          periodLabel ||
          new Date().toLocaleDateString(locale === "en" ? "en-US" : locale === "ar" ? "ar-DZ" : "fr-FR", {
            year: "numeric",
            month: "long",
          }),
        locale,
        kpis: {
          totalIncidents: totalCount,
          openIncidents: openCount,
          resolutionRatePct,
          avgResolutionHours: kpi?.meanResolutionHours ?? null,
          trainingCompliancePct: kpi?.trainingComplianceRate ?? null,
          overdueActions: kpi?.correctiveActionsOverdue ?? 0,
        },
        incidents: rows.map((item) => ({
          incidentId: item.incidentId,
          type: item.type,
          severity: item.severity,
          status: item.status,
          zone: item.zone,
          department: item.department,
          reportedAt: item.timestamp || item.createdAt,
        })),
      });
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [open, periodLabel, initialIncidents, locale, user, copy.dialogTitle]);

  const handlePrintPdf = () => {
    if (!payload) return;
    const html = buildSafetyReportHtml(payload);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    iframe.srcdoc = html;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => iframe.remove(), 2000);
      }
    };
    document.body.appendChild(iframe);
  };

  const handleDownloadHtml = () => {
    if (!payload) return;
    const html = buildSafetyReportHtml(payload);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prosafe-iso45001-report-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="safety-pdf-modal"
        className="max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FileText className="h-5 w-5 text-prosafe-600 shrink-0" />
            <span>{copy.dialogTitle}</span>
          </DialogTitle>
          <DialogDescription>{copy.dialogDesc}</DialogDescription>
        </DialogHeader>

        {loading || !payload ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
            <Loader2 className="h-6 w-6 animate-spin text-prosafe-600" />
            <span>{copy.loading}</span>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Report Meta Strip */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">{payload.organization}</span>
                <span className="tabular-nums">
                  {payload.periodLabel} · {payload.generatedBy} ·{" "}
                  {payload.generatedAtIso.slice(0, 10)}
                </span>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: copy.totalIncidents, value: String(payload.kpis.totalIncidents) },
                  { label: copy.openIncidents, value: String(payload.kpis.openIncidents) },
                  {
                    label: copy.resolutionRate,
                    value:
                      payload.kpis.resolutionRatePct !== null
                        ? `${Math.round(payload.kpis.resolutionRatePct)}%`
                        : "—",
                  },
                  {
                    label: copy.avgResolution,
                    value:
                      payload.kpis.avgResolutionHours !== null
                        ? `${payload.kpis.avgResolutionHours.toFixed(1)} h`
                        : "—",
                  },
                  {
                    label: copy.trainingCompliance,
                    value:
                      payload.kpis.trainingCompliancePct !== null
                        ? `${Math.round(payload.kpis.trainingCompliancePct)}%`
                        : "—",
                  },
                  { label: copy.overdueActions, value: String(payload.kpis.overdueActions) },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-slate-200 bg-white p-3.5"
                  >
                    <p className="text-[11px] font-medium text-slate-500">{metric.label}</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Included Incident Table Preview */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {copy.recentRegister}{" "}
                  <span className="font-normal text-slate-500 tabular-nums">
                    ({payload.incidents.length})
                  </span>
                </h3>
                <div className="rounded-lg border border-slate-200 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="text-start font-medium px-3 py-2">{copy.colId}</th>
                        <th className="text-start font-medium px-3 py-2">{copy.colType}</th>
                        <th className="text-start font-medium px-3 py-2">{copy.colSeverity}</th>
                        <th className="text-start font-medium px-3 py-2">{copy.colStatus}</th>
                        <th className="text-start font-medium px-3 py-2">{copy.colZone}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payload.incidents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                            {copy.empty}
                          </td>
                        </tr>
                      ) : (
                        payload.incidents.slice(0, 10).map((row) => (
                          <tr key={row.incidentId} className="hover:bg-slate-50/70">
                            <td className="px-3 py-2 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                              {row.incidentId}
                            </td>
                            <td className="px-3 py-2 text-slate-700">{row.type}</td>
                            <td className="px-3 py-2 text-slate-700">{row.severity}</td>
                            <td className="px-3 py-2 text-slate-700">{row.status}</td>
                            <td className="px-3 py-2 text-slate-600">{row.zone || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={handleDownloadHtml}>
                <Download className="h-4 w-4 me-2" />
                {copy.downloadBtn}
              </Button>
              <Button
                onClick={handlePrintPdf}
                className="bg-prosafe-600 hover:bg-prosafe-700"
              >
                <Printer className="h-4 w-4 me-2" />
                {copy.printBtn}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SafetyReportPdfModal;
