import api from "./api";
import type { InventoryCategory, InventoryCondition } from "./inventoryApi";

export type MaintenanceType = "inspection" | "preventive" | "corrective";
export type MaintenanceStatus = "planned" | "done" | "overdue" | "cancelled";
export type MaintenanceResult = "ok" | "issues" | "failed";

export interface Maintenance {
  id: number;
  itemId: number;
  type: MaintenanceType;
  scheduledAt: string;
  doneAt?: string | null;
  performedById?: number | null;
  result?: MaintenanceResult | null;
  notes?: string | null;
  status: MaintenanceStatus;
  item?: {
    id: number;
    name: string;
    category: InventoryCategory;
    condition: InventoryCondition;
    location?: string | null;
  };
  performedBy?: { id: number; firstName: string; lastName: string } | null;
}

export interface MaintenanceList {
  data: Maintenance[];
  total: number;
  page: number;
  limit: number;
}

export interface MaintenanceFilters {
  itemId?: number;
  status?: MaintenanceStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const maintenanceApi = {
  list: (params: MaintenanceFilters = {}) =>
    api.get<MaintenanceList>("/maintenance", {
      params: Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
      ),
    }),
  create: (data: {
    itemId: number;
    type: MaintenanceType;
    scheduledAt: string;
    notes?: string;
  }) => api.post<Maintenance>("/maintenance", data),
  update: (
    id: number,
    data: {
      type?: MaintenanceType;
      scheduledAt?: string;
      notes?: string;
      status?: "planned" | "cancelled";
    }
  ) => api.patch<Maintenance>(`/maintenance/${id}`, data),
  complete: (
    id: number,
    data: {
      result: MaintenanceResult;
      notes?: string;
      doneAt?: string;
      nextScheduledAt?: string;
    }
  ) => api.patch<Maintenance>(`/maintenance/${id}/complete`, data),
};
