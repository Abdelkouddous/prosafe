import api from "./api";
import type { Paginated } from "./incidentApi";

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type RiskStatus = "proposed" | "validated" | "mitigated" | "archived";

export interface Risk {
  id: number;
  title: string;
  description?: string | null;
  hazardCategory: string;
  zone?: string | null;
  department?: string | null;
  gravity: number;
  probability: number;
  score: number;
  level: RiskLevel;
  recommendedMeasures?: string | null;
  status: RiskStatus;
}

export interface MatrixCell {
  gravity: number;
  probability: number;
  score: number;
  level: RiskLevel;
  count: number;
  riskIds: number[];
}

export interface RiskMatrix {
  total: number;
  cells: MatrixCell[];
}

export interface LmraHazardInput {
  label: string;
  present: boolean;
  controlled: boolean;
}

export interface LmraAssessment {
  id: number;
  task: string;
  location?: string | null;
  hazards: LmraHazardInput[];
  decision: "go" | "stop";
  comments?: string | null;
  riskIds: number[];
  createdAt: string;
}

/** Same thresholds as the backend: low 1-4, medium 5-9, high 10-14, critical 15-25. */
export const levelFromScore = (score: number): RiskLevel =>
  score >= 15 ? "critical" : score >= 10 ? "high" : score >= 5 ? "medium" : "low";

export const fetchRisks = async (params: {
  level?: RiskLevel;
  zone?: string;
  search?: string;
  hazardCategory?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<Risk>> => (await api.get("/risks", { params })).data;

export const fetchRisk = async (id: number): Promise<Risk> =>
  (await api.get(`/risks/${id}`)).data;

export const fetchRiskMatrix = async (): Promise<RiskMatrix> =>
  (await api.get("/risks/matrix")).data;

export interface RiskInput {
  title: string;
  description: string;
  hazardCategory: string;
  zone: string;
  department?: string;
  gravity: number;
  probability: number;
  recommendedMeasures?: string;
}

export const createRisk = async (input: RiskInput): Promise<Risk> =>
  (await api.post("/risks", input)).data;

export const createLmra = async (input: {
  task: string;
  location: string;
  hazards: LmraHazardInput[];
  decision: "go" | "stop";
  comments?: string;
}): Promise<LmraAssessment> => (await api.post("/risks/lmra", input)).data;

export const fetchMyLmra = async (): Promise<LmraAssessment[]> => {
  const res = await api.get("/risks/lmra", { params: { limit: 50 } });
  const body = res.data as Paginated<LmraAssessment> | LmraAssessment[];
  return Array.isArray(body) ? body : body.data;
};
