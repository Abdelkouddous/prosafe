import api from "./api";

export interface StatsOverview {
  incidents: {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
    closed: number;
  };
  activeAlerts: number;
  criticalOpen: number;
  lowStock: number;
  overdueMaintenance: number;
  expiringTrainings: number;
}

export interface StatsKpis {
  incidentsPerMonth: { month: string; count: number }[];
  meanResolutionHours: number | null;
  equipmentComplianceRate: number | null;
  trainingComplianceRate: number | null;
  correctiveActionsOverdue: number;
  auditComplianceRate: number | null;
}

export type GroupBy =
  | "month"
  | "type"
  | "severity"
  | "zone"
  | "department"
  | "status";

export interface GroupCount {
  key: string;
  count: number;
}

export interface ForecastResult {
  history: { month: string; count: number }[];
  forecast: {
    month: string;
    count: number;
    method: "linear_regression" | "moving_average";
  }[];
}

export interface StatsFilters {
  from?: string;
  to?: string;
  type?: string;
  department?: string;
}

const clean = (o: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

export const statsApi = {
  overview: () => api.get<StatsOverview>("/stats/overview"),
  kpis: (f: { from?: string; to?: string } = {}) =>
    api.get<StatsKpis>("/stats/kpis", { params: clean(f) }),
  incidents: (groupBy: GroupBy, f: StatsFilters = {}) =>
    api.get<GroupCount[]>("/stats/incidents", {
      params: clean({ groupBy, ...f }),
    }),
  forecast: (months = 3) =>
    api.get<ForecastResult>("/stats/forecast", { params: { months } }),
};
