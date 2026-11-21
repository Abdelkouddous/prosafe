import api from "./api";
import type { Paginated } from "./incidentApi";

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface EmergencyScenario {
  id: number;
  title: string;
  type: string;
  steps: string[];
  contacts: EmergencyContact[];
  assemblyPoint?: string | null;
  isActive: boolean;
}

export interface EmergencyEvent {
  id: number;
  scenarioId?: number | null;
  scenario?: EmergencyScenario | null;
  message: string;
  zone?: string | null;
  triggeredAt: string;
  closedAt?: string | null;
  active: boolean;
}

export interface Drill {
  id: number;
  scenario?: { id: number; title: string } | null;
  scheduledAt: string;
  zone?: string | null;
  status: "planned" | "done" | "cancelled";
}

const list = <T>(body: Paginated<T> | T[]): T[] => (Array.isArray(body) ? body : body.data);

export const fetchScenarios = async (): Promise<EmergencyScenario[]> =>
  list((await api.get("/emergency/scenarios", { params: { limit: 100 } })).data);

export const fetchActiveEvents = async (): Promise<EmergencyEvent[]> =>
  list((await api.get("/emergency/events", { params: { active: true, limit: 20 } })).data);

export const fetchDrills = async (): Promise<Drill[]> =>
  list(
    (await api.get("/emergency/drills", { params: { status: "planned", from: new Date().toISOString(), limit: 50 } }))
      .data
  );

export const triggerEmergency = async (input: {
  scenarioId?: number;
  message: string;
  zone?: string;
}): Promise<EmergencyEvent> => (await api.post("/emergency/trigger", input)).data;

export const closeEmergencyEvent = async (id: number): Promise<EmergencyEvent> =>
  (await api.patch(`/emergency/events/${id}/close`)).data;
