import api from "./api";

export interface InventoryItem {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  min_stock_level: number;
  category:
    | "electronics"
    | "office_supplies"
    | "furniture"
    | "safety_equipment"
    | "tools"
    | "consumables"
    | "other";
  status: "active" | "inactive" | "out_of_stock" | "discontinued" | "low_stock";
  supplier?: string;
  location?: string;
  created_by?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  updated_by?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  created_at: string;
  updated_at: string;
}

export interface InventoryResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  activeItems: number;
  totalValue: number;
}

// Add the enum definition at the top of the file
export enum InventoryCategory {
  ELECTRONICS = "electronics",
  OFFICE_SUPPLIES = "office_supplies",
  FURNITURE = "furniture",
  SAFETY_EQUIPMENT = "safety_equipment",
  TOOLS = "tools",
  CONSUMABLES = "consumables",
  OTHER = "other",
}

export enum InventoryStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCONTINUED = "discontinued",
}

export interface CreateInventoryItemDto {
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  min_stock_level: number;
  category: InventoryCategory; // Changed from string to InventoryCategory
  status?: InventoryStatus; // Changed from string to InventoryStatus
  supplier?: string;
  location?: string;
}

export const inventoryApi = {
  getItems: async (
    page = 1,
    limit = 10,
    category?: string,
    status?: string
  ) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (category) params.append("category", category);
      if (status) params.append("status", status);

      return await api.get<InventoryResponse>(
        `/inventory?${params.toString()}`
      );
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      throw error;
    }
  },

  getItem: async (id: number) => {
    try {
      return await api.get<InventoryItem>(`/inventory/${id}`);
    } catch (error) {
      console.error(`Error fetching inventory item ${id}:`, error);
      throw error;
    }
  },

  createItem: async (data: CreateInventoryItemDto) => {
    try {
      return await api.post<InventoryItem>("/inventory", data);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      throw error;
    }
  },

  updateItem: async (id: number, data: Partial<InventoryItem>) => {
    try {
      return await api.patch<InventoryItem>(`/inventory/${id}`, data);
    } catch (error) {
      console.error(`Error updating inventory item ${id}:`, error);
      throw error;
    }
  },

  deleteItem: async (id: number) => {
    try {
      return await api.delete(`/inventory/${id}`);
    } catch (error) {
      console.error(`Error deleting inventory item ${id}:`, error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      return await api.get<InventoryStats>("/inventory/stats");
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
      throw error;
    }
  },

  getLowStockItems: async () => {
    try {
      return await api.get<InventoryItem[]>("/inventory/low-stock");
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      throw error;
    }
  },
};
