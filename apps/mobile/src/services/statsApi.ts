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

export type StatsGroupBy = "month" | "type" | "severity" | "zone" | "department" | "status";

export interface StatsBucket {
  key: string;
  count: number;
}

export interface StatsKpis {
  incidentsPerMonth: { month: string; count: number }[];
  meanResolutionHours: number | null;
  equipmentComplianceRate: number | null;
  trainingComplianceRate: number | null;
  correctiveActionsOverdue: number;
  auditComplianceRate: number | null;
}

export interface StatsForecast {
  history: { month: string; count: number }[];
  forecast: { month: string; count: number; method: "linear_regression" | "moving_average" }[];
}

export const fetchStatsOverview = async (): Promise<StatsOverview> =>
  (await api.get("/stats/overview")).data;

/** Manager only. */
export const fetchStatsIncidents = async (params: {
  groupBy: StatsGroupBy;
  from?: string;
  to?: string;
}): Promise<StatsBucket[]> => (await api.get("/stats/incidents", { params })).data;

/** Manager only. */
export const fetchStatsKpis = async (params: { from?: string; to?: string } = {}): Promise<StatsKpis> =>
  (await api.get("/stats/kpis", { params })).data;

/** Manager only. */
export const fetchStatsForecast = async (months = 3): Promise<StatsForecast> =>
  (await api.get("/stats/forecast", { params: { months } })).data;
