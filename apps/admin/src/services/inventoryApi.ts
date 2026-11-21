import api from "./api";

export const INVENTORY_CATEGORIES = [
  "ppe",
  "fire_extinguisher",
  "first_aid",
  "detection",
  "signage",
  "tools",
  "consumables",
  "other",
] as const;
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const INVENTORY_STATUSES = [
  "active",
  "inactive",
  "out_of_stock",
  "discontinued",
  "low_stock",
] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export type InventoryCondition = "functional" | "non_functional";

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  quantity: number;
  min_stock_level: number;
  category: InventoryCategory;
  status: InventoryStatus;
  condition: InventoryCondition;
  expiryDate?: string | null;
  lastInspectionAt?: string | null;
  nextInspectionAt?: string | null;
  supplier?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryListResponse {
  data: InventoryItem[];
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  activeItems: number;
  nonFunctionalItems: number;
  totalValue: number;
}

export interface InventoryFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  condition?: string;
  search?: string;
}

export interface InventoryPayload {
  name: string;
  sku: string;
  description: string;
  price: number;
  quantity: number;
  min_stock_level: number;
  category: InventoryCategory;
  status?: InventoryStatus;
  condition?: InventoryCondition;
  expiryDate?: string | null;
  lastInspectionAt?: string | null;
  nextInspectionAt?: string | null;
  supplier?: string;
  location?: string;
}

const clean = (f: InventoryFilters) =>
  Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== undefined && v !== "" && v !== "all")
  );

export const inventoryApi = {
  getItems: (filters: InventoryFilters = {}) =>
    api.get<InventoryListResponse>("/inventory", { params: clean(filters) }),
  getItem: (id: number) => api.get<InventoryItem>(`/inventory/${id}`),
  createItem: (data: InventoryPayload) =>
    api.post<InventoryItem>("/inventory", data),
  updateItem: (id: number, data: Partial<InventoryPayload>) =>
    api.patch<InventoryItem>(`/inventory/${id}`, data),
  deleteItem: (id: number) => api.delete(`/inventory/${id}`),
  getStats: () => api.get<InventoryStats>("/inventory/stats"),
};
