export interface IncidentStatusTotals {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  closed: number;
}

export interface PipelineSegment {
  key: "open" | "investigating" | "resolved" | "closed";
  count: number;
  pct: number;
}

export interface ComplianceInputs {
  equipmentComplianceRate: number | null;
  trainingComplianceRate: number | null;
  auditComplianceRate: number | null;
}

export interface MonthlyBarPoint {
  month: string;
  shortLabel: string;
  count: number;
  heightPct: number;
  isPeak: boolean;
}

export interface ResolutionFraction {
  resolvedCount: number;
  totalCount: number;
  percentage: number;
}

/**
 * Computes normalized percentage segments for the executive incident pipeline bar.
 * Always returns all 4 stages in workflow order; never returns NaN when total is 0.
 */
export function computePipelineSegments(
  incidents: IncidentStatusTotals
): PipelineSegment[] {
  const counts = {
    open: Math.max(0, incidents.open || 0),
    investigating: Math.max(0, incidents.investigating || 0),
    resolved: Math.max(0, incidents.resolved || 0),
    closed: Math.max(0, incidents.closed || 0),
  };
  const sum =
    counts.open + counts.investigating + counts.resolved + counts.closed;
  const denom = sum > 0 ? sum : Math.max(0, incidents.total || 0);

  const pctOf = (value: number) =>
    denom > 0 ? Math.round((value / denom) * 100) : 0;

  return [
    { key: "open", count: counts.open, pct: pctOf(counts.open) },
    {
      key: "investigating",
      count: counts.investigating,
      pct: pctOf(counts.investigating),
    },
    { key: "resolved", count: counts.resolved, pct: pctOf(counts.resolved) },
    { key: "closed", count: counts.closed, pct: pctOf(counts.closed) },
  ];
}

/**
 * Computes the mean ISO 45001 compliance score across available (non-null) pillars.
 */
export function computeOverallCompliance(
  kpis: ComplianceInputs
): number | null {
  const values = [
    kpis.equipmentComplianceRate,
    kpis.trainingComplianceRate,
    kpis.auditComplianceRate,
  ].filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  if (values.length === 0) return null;
  const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Computes resolved + closed fraction for the Priority Queue progress header.
 */
export function computeResolutionFraction(
  incidents: IncidentStatusTotals
): ResolutionFraction {
  const resolvedCount =
    Math.max(0, incidents.resolved || 0) + Math.max(0, incidents.closed || 0);
  const totalCount = Math.max(
    incidents.total || 0,
    resolvedCount +
      Math.max(0, incidents.open || 0) +
      Math.max(0, incidents.investigating || 0)
  );
  const percentage =
    totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  return { resolvedCount, totalCount, percentage };
}

/**
 * Normalizes monthly incident series into pill-bar geometry (0..100%) and identifies peak month.
 */
export function computeMonthlySeries(
  rows: { month: string; count: number }[],
  maxBars = 7
): MonthlyBarPoint[] {
  const sliced = rows.slice(-maxBars);
  if (sliced.length === 0) return [];

  const maxVal = sliced.reduce((m, r) => Math.max(m, r.count), 0);
  let peakIndex = -1;
  if (maxVal > 0) {
    for (let i = 0; i < sliced.length; i++) {
      if (sliced[i].count === maxVal) {
        peakIndex = i; // latest peak if tied
      }
    }
  }

  return sliced.map((row, idx) => {
    const parts = row.month.split("-");
    const shortLabel = parts.length >= 2 ? parts[1] : row.month.slice(0, 3);
    const ratio = maxVal > 0 ? Math.round((row.count / maxVal) * 100) : 0;
    return {
      month: row.month,
      shortLabel,
      count: row.count,
      heightPct: row.count > 0 ? Math.max(18, ratio) : 8,
      isPeak: idx === peakIndex,
    };
  });
}
