import api from "./api";

export type InventoryCategory =
  | "ppe"
  | "fire_extinguisher"
  | "first_aid"
  | "detection"
  | "signage"
  | "tools"
  | "consumables"
  | "other";

export type InventoryCondition = "functional" | "non_functional";

export interface InventoryItem {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  min_stock_level: number;
  category: InventoryCategory;
  status: string;
  condition: InventoryCondition;
  expiryDate: string | null;
  nextInspectionAt: string | null;
  location: string | null;
}

export interface InventoryPage {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryQuery {
  category?: InventoryCategory;
  condition?: InventoryCondition;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const fetchInventory = async (params: InventoryQuery): Promise<InventoryPage> => {
  const res = await api.get("/inventory", { params });
  const body = res.data ?? {};
  return {
    items: body.items ?? body.data ?? [],
    total: body.total ?? 0,
    page: body.page ?? 1,
    limit: body.limit ?? params.limit ?? 20,
    totalPages: body.totalPages ?? 1,
  };
};

export const reportDefect = async (id: number, description: string) =>
  (await api.post(`/inventory/${id}/report-defect`, { description })).data;

/** Manager-only (admin / sst_manager). */
export const updateInventoryQuantity = async (id: number, quantity: number) =>
  (await api.patch(`/inventory/${id}`, { quantity })).data;
