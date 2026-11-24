export const DEMO_ADMIN_EMAIL = "admin@prosafe.demo";
export const DEMO_EMPLOYEE_EMAIL = "karim.benali@prosafe.demo";
export type DemoPersonaRole = "admin" | "employee";

export function isDemoAccount(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === DEMO_ADMIN_EMAIL || normalized === DEMO_EMPLOYEE_EMAIL;
}

export interface CommandPaletteItem {
  id: string;
  group: "navigation" | "actions" | "incidents" | "risks";
  title: string;
  subtitle?: string;
  keywords?: string[];
  to?: string;
  actionId?: string;
}

export function filterCommandItems(
  items: CommandPaletteItem[],
  query: string
): CommandPaletteItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [
      item.title,
      item.subtitle ?? "",
      ...(item.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface SafetyReportIncidentRow {
  incidentId: string;
  type: string;
  severity: string;
  status: string;
  zone?: string | null;
  department?: string | null;
  reportedAt?: string | null;
}

export interface SafetyReportPayload {
  title: string;
  organization: string;
  generatedBy: string;
  generatedAtIso: string;
  periodLabel: string;
  locale: "fr" | "en" | "ar";
  kpis: {
    totalIncidents: number;
    openIncidents: number;
    resolutionRatePct: number | null;
    avgResolutionHours: number | null;
    trainingCompliancePct: number | null;
    overdueActions: number;
  };
  incidents: SafetyReportIncidentRow[];
}

export function buildSafetyReportHtml(payload: SafetyReportPayload): string {
  const isRtl = payload.locale === "ar";
  const dir = isRtl ? "rtl" : "ltr";
  const labels =
    payload.locale === "fr"
      ? {
          kicker: "RAPPORT DE SYNTHÈSE SST · CONFORMITÉ ISO 45001",
          period: "Période analysée",
          preparedBy: "Préparé par",
          generatedOn: "Généré le",
          kpiTotal: "Total incidents",
          kpiOpen: "Incidents ouverts",
          kpiResolution: "Taux de résolution",
          kpiAvgTime: "Délai moyen",
          kpiTraining: "Conformité formations",
          kpiOverdue: "Actions en retard",
          registerTitle: "Registre des incidents récents",
          colId: "Référence",
          colType: "Type",
          colSeverity: "Gravité",
          colStatus: "Statut",
          colZone: "Zone / Service",
          colDate: "Date",
          emptyRows: "Aucun incident enregistré sur cette période.",
          signoffTitle: "Validation & Visa HSE",
          signoffManager: "Responsable HSE / SST",
          signoffDirection: "Direction de Site",
          footerNote:
            "Document généré automatiquement par PROSAFE — Plateforme de gestion de la santé et sécurité au travail.",
        }
      : payload.locale === "ar"
        ? {
            kicker: "تقرير ملخص السلامة المهنية · الامتثال لمعيار ISO 45001",
            period: "الفترة المحللة",
            preparedBy: "أعدّه",
            generatedOn: "تاريخ الإصدار",
            kpiTotal: "إجمالي الحوادث",
            kpiOpen: "الحوادث المفتوحة",
            kpiResolution: "معدل المعالجة",
            kpiAvgTime: "متوسط وقت الإغلاق",
            kpiTraining: "امتثال التدريب",
            kpiOverdue: "إجراءات متأخرة",
            registerTitle: "سجل الحوادث الأخيرة",
            colId: "المرجع",
            colType: "النوع",
            colSeverity: "الخطورة",
            colStatus: "الحالة",
            colZone: "المنطقة / القسم",
            colDate: "التاريخ",
            emptyRows: "لا توجد حوادث مسجلة خلال هذه الفترة.",
            signoffTitle: "الاعتماد والتوقيع",
            signoffManager: "مسؤول السلامة HSE",
            signoffDirection: "إدارة الموقع",
            footerNote: "مستند تم إنشاؤه تلقائياً عبر منصة PROSAFE لإدارة الصحة والسلامة المهنية.",
          }
        : {
            kicker: "OHS EXECUTIVE SAFETY SUMMARY · ISO 45001 COMPLIANCE",
            period: "Reporting period",
            preparedBy: "Prepared by",
            generatedOn: "Generated on",
            kpiTotal: "Total Incidents",
            kpiOpen: "Open Incidents",
            kpiResolution: "Resolution Rate",
            kpiAvgTime: "Avg Resolution",
            kpiTraining: "Training Compliance",
            kpiOverdue: "Overdue Actions",
            registerTitle: "Recent Incident Register",
            colId: "Reference",
            colType: "Type",
            colSeverity: "Severity",
            colStatus: "Status",
            colZone: "Zone / Dept",
            colDate: "Date",
            emptyRows: "No incidents recorded for this reporting period.",
            signoffTitle: "HSE Review & Sign-Off",
            signoffManager: "HSE / SST Manager",
            signoffDirection: "Site Director",
            footerNote:
              "Generated automatically by PROSAFE Occupational Health & Safety Management Platform.",
          };

  const fmtPct = (v: number | null) => (v === null ? "—" : `${Math.round(v)}%`);
  const fmtHrs = (v: number | null) => (v === null ? "—" : `${v.toFixed(1)} h`);

  const rowsHtml =
    payload.incidents.length === 0
      ? `<tr><td colspan="6" class="empty">${escapeHtml(labels.emptyRows)}</td></tr>`
      : payload.incidents
          .slice(0, 25)
          .map((row) => {
            const loc = [row.zone, row.department].filter(Boolean).join(" · ") || "—";
            const dateStr = row.reportedAt
              ? new Date(row.reportedAt).toISOString().slice(0, 10)
              : "—";
            return `<tr>
              <td class="mono">${escapeHtml(row.incidentId)}</td>
              <td>${escapeHtml(row.type)}</td>
              <td>${escapeHtml(row.severity)}</td>
              <td>${escapeHtml(row.status)}</td>
              <td>${escapeHtml(loc)}</td>
              <td class="mono">${escapeHtml(dateStr)}</td>
            </tr>`;
          })
          .join("");

  return `<!doctype html>
<html lang="${escapeHtml(payload.locale)}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(payload.title)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
      font-size: 12px;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #0565d3;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    .kicker {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #0565d3;
      margin: 0 0 6px 0;
    }
    h1 { font-size: 22px; margin: 0 0 4px 0; color: #0f172a; }
    .org { font-size: 13px; color: #475569; margin: 0; }
    .meta { font-size: 11px; color: #475569; text-align: ${isRtl ? "left" : "right"}; }
    .meta div { margin-bottom: 2px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 22px;
    }
    .kpi {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .kpi-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-value { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px; font-variant-numeric: tabular-nums; }
    h2 { font-size: 14px; margin: 0 0 10px 0; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 26px; }
    th, td {
      border-bottom: 1px solid #e2e8f0;
      padding: 7px 8px;
      text-align: ${isRtl ? "right" : "left"};
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #475569;
    }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; }
    .empty { text-align: center; color: #64748b; padding: 18px; }
    .signoff {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .sig-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      min-height: 76px;
    }
    .sig-label { font-size: 11px; font-weight: 600; color: #334155; }
    .sig-line { margin-top: 36px; border-top: 1px dashed #cbd5e1; }
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <p class="kicker">${escapeHtml(labels.kicker)}</p>
      <h1>${escapeHtml(payload.title)}</h1>
      <p class="org">${escapeHtml(payload.organization)}</p>
    </div>
    <div class="meta">
      <div><strong>${escapeHtml(labels.period)}:</strong> ${escapeHtml(payload.periodLabel)}</div>
      <div><strong>${escapeHtml(labels.preparedBy)}:</strong> ${escapeHtml(payload.generatedBy)}</div>
      <div><strong>${escapeHtml(labels.generatedOn)}:</strong> <span class="mono">${escapeHtml(payload.generatedAtIso.slice(0, 10))}</span></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">${escapeHtml(labels.kpiTotal)}</div><div class="kpi-value">${escapeHtml(payload.kpis.totalIncidents)}</div></div>
    <div class="kpi"><div class="kpi-label">${escapeHtml(labels.kpiOpen)}</div><div class="kpi-value">${escapeHtml(payload.kpis.openIncidents)}</div></div>
    <div class="kpi"><div class="kpi-label">${escapeHtml(labels.kpiResolution)}</div><div class="kpi-value">${escapeHtml(fmtPct(payload.kpis.resolutionRatePct))}</div></div>
    <div class="kpi"><div class="kpi-label">${escapeHtml(labels.kpiAvgTime)}</div><div class="kpi-value">${escapeHtml(fmtHrs(payload.kpis.avgResolutionHours))}</div></div>
    <div class="kpi"><div class="kpi-label">${escapeHtml(labels.kpiTraining)}</div><div class="kpi-value">${escapeHtml(fmtPct(payload.kpis.trainingCompliancePct))}</div></div>
    <div class="kpi"><div class="kpi-label">${escapeHtml(labels.kpiOverdue)}</div><div class="kpi-value">${escapeHtml(payload.kpis.overdueActions)}</div></div>
  </div>

  <h2>${escapeHtml(labels.registerTitle)}</h2>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(labels.colId)}</th>
        <th>${escapeHtml(labels.colType)}</th>
        <th>${escapeHtml(labels.colSeverity)}</th>
        <th>${escapeHtml(labels.colStatus)}</th>
        <th>${escapeHtml(labels.colZone)}</th>
        <th>${escapeHtml(labels.colDate)}</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <h2>${escapeHtml(labels.signoffTitle)}</h2>
  <div class="signoff">
    <div class="sig-box"><div class="sig-label">${escapeHtml(labels.signoffManager)}</div><div class="sig-line"></div></div>
    <div class="sig-box"><div class="sig-label">${escapeHtml(labels.signoffDirection)}</div><div class="sig-line"></div></div>
  </div>

  <div class="footer">${escapeHtml(labels.footerNote)}</div>
</body>
</html>`;
}
