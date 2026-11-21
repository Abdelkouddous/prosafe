import api from "./api";
import { cleanParams, type Paginated } from "@/lib/params";

export type ScenarioType = "fire" | "evacuation" | "chemical" | "injury" | "earthquake" | "gas_leak" | "other";
export const SCENARIO_TYPES: ScenarioType[] = ["fire", "evacuation", "chemical", "injury", "earthquake", "gas_leak", "other"];
export type DrillStatus = "planned" | "done" | "cancelled";

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface Scenario {
  id: number;
  title: string;
  type: ScenarioType;
  steps: string[];
  contacts: EmergencyContact[];
  assemblyPoint?: string | null;
  isActive: boolean;
}

export type ScenarioInput = Omit<Scenario, "id">;

export interface EmergencyEvent {
  id: number;
  scenarioId?: number | null;
  scenario?: Scenario | null;
  message: string;
  zone?: string | null;
  triggeredAt: string;
  closedAt?: string | null;
  active: boolean;
}

export interface Drill {
  id: number;
  scenarioId?: number | null;
  scenario?: Scenario | null;
  scheduledAt: string;
  zone?: string | null;
  status: DrillStatus;
  durationSeconds?: number | null;
  participantsCount?: number | null;
  evacuatedCount?: number | null;
  observations?: string | null;
}

export interface DrillInput {
  scenarioId?: number;
  scheduledAt?: string;
  zone?: string;
  status?: DrillStatus;
  durationSeconds?: number;
  participantsCount?: number;
  evacuatedCount?: number;
  observations?: string;
}

/** Fired after an alert is triggered / closed so the global banner refreshes. */
export const EMERGENCY_CHANGED = "prosafe:emergency-changed";
export const notifyEmergencyChanged = () => window.dispatchEvent(new Event(EMERGENCY_CHANGED));

export const emergencyApi = {
  scenarios: () => api.get<Paginated<Scenario>>("/emergency/scenarios", { params: { limit: 100 } }),
  createScenario: (d: ScenarioInput) => api.post<Scenario>("/emergency/scenarios", d),
  updateScenario: (id: number, d: Partial<ScenarioInput>) => api.patch<Scenario>(`/emergency/scenarios/${id}`, d),
  removeScenario: (id: number) => api.delete(`/emergency/scenarios/${id}`),
  trigger: (d: { scenarioId?: number; message: string; zone?: string }) =>
    api.post<EmergencyEvent>("/emergency/trigger", d),
  events: (f: { active?: boolean; page?: number; limit?: number } = {}) =>
    api.get<Paginated<EmergencyEvent>>("/emergency/events", { params: cleanParams({ limit: 20, ...f }) }),
  close: (id: number) => api.patch<EmergencyEvent>(`/emergency/events/${id}/close`),
  drills: (f: { status?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Drill>>("/emergency/drills", { params: cleanParams({ limit: 50, ...f }) }),
  createDrill: (d: DrillInput) => api.post<Drill>("/emergency/drills", d),
  updateDrill: (id: number, d: DrillInput) => api.patch<Drill>(`/emergency/drills/${id}`, d),
  removeDrill: (id: number) => api.delete(`/emergency/drills/${id}`),
};
