import api from "./api";
import { cleanParams, type Paginated } from "@/lib/params";
import type { CorrectiveAction } from "./correctiveActionApi";

export type RiskStatus = "proposed" | "validated" | "mitigated" | "archived";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export const RISK_STATUSES: RiskStatus[] = ["proposed", "validated", "mitigated", "archived"];
export const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

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
  proposedById?: number | null;
  validatedById?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ActionPlanStatus = "planned" | "in_progress" | "completed" | "validated";
export const PLAN_STATUSES: ActionPlanStatus[] = ["planned", "in_progress", "completed", "validated"];

export interface ActionPlan {
  id: number;
  riskId: number;
  title: string;
  description?: string | null;
  ownerId?: number | null;
  owner?: { id: number; firstName: string; lastName: string } | null;
  dueDate?: string | null;
  status: ActionPlanStatus;
  progress: number;
}

export interface RiskDetail extends Risk {
  actionPlans: ActionPlan[];
  correctiveActions: CorrectiveAction[];
}

export interface RiskInput {
  title: string;
  description?: string;
  hazardCategory: string;
  zone?: string;
  department?: string;
  gravity?: number;
  probability?: number;
  recommendedMeasures?: string;
}

export interface RiskFilters {
  status?: string;
  level?: string;
  zone?: string;
  hazardCategory?: string;
  search?: string;
  page?: number;
  limit?: number;
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

export interface PlanInput {
  riskId?: number;
  title?: string;
  description?: string;
  ownerId?: number;
  dueDate?: string;
  status?: ActionPlanStatus;
  progress?: number;
}

export interface LmraHazard {
  label: string;
  present: boolean;
  controlled: boolean;
}

export interface Lmra {
  id: number;
  userId: number;
  user?: { id: number; firstName: string; lastName: string } | null;
  task: string;
  location?: string | null;
  hazards: LmraHazard[];
  decision: "go" | "stop";
  comments?: string | null;
  riskIds?: number[];
  createdAt: string;
}

export const risksApi = {
  list: (f: RiskFilters = {}) =>
    api.get<Paginated<Risk>>("/risks", { params: cleanParams({ limit: 20, ...f }) }),
  get: (id: number) => api.get<RiskDetail>(`/risks/${id}`),
  create: (d: RiskInput) => api.post<Risk>("/risks", d),
  update: (id: number, d: Partial<Omit<RiskInput, "gravity" | "probability">> & { status?: RiskStatus }) =>
    api.patch<Risk>(`/risks/${id}`, d),
  evaluate: (id: number, gravity: number, probability: number) =>
    api.patch<Risk>(`/risks/${id}/evaluate`, { gravity, probability }),
  remove: (id: number) => api.delete(`/risks/${id}`),
  matrix: (f: { status?: string; zone?: string; hazardCategory?: string } = {}) =>
    api.get<RiskMatrix>("/risks/matrix", { params: cleanParams(f) }),

  listPlans: (f: { riskId?: number; status?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<ActionPlan>>("/action-plans", { params: cleanParams({ limit: 100, ...f }) }),
  createPlan: (d: PlanInput) => api.post<ActionPlan>("/action-plans", d),
  updatePlan: (id: number, d: Omit<PlanInput, "riskId">) => api.patch<ActionPlan>(`/action-plans/${id}`, d),
  removePlan: (id: number) => api.delete(`/action-plans/${id}`),

  listLmra: (f: { decision?: string; from?: string; to?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Lmra>>("/risks/lmra", { params: cleanParams({ limit: 20, ...f }) }),
};
