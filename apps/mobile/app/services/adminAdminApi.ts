import api from "./api";

export interface AdminDashboardStats {
  alerts: {
    total: number;
    unresolved: number;
    critical: number;
    high: number;
  };
  inventory: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    activeItems: number;
    totalValue: number;
  };
  messages: {
    unreadCount: number;
  };
  totalUsers: number;
  totalTasks: number;
  totalIncidents: number;
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminTask {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  dueDate?: string;
}

export interface AdminIncident {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface AdminMessage {
  id: number;
  subject: string;
  content: string;
  status: "unread" | "read" | "archived";
  is_urgent: boolean;
  created_at: string;
}

export interface AdminInventoryItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  min_stock_level: number;
  category: string;
  status: string;
  updated_at: string;
}

export interface AdminAlert {
  id: number;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "monitoring" | "unresolved" | "investigating" | "resolved" | "dismissed";
  created_at: string;
  updated_at: string;
}

export const adminApi = {
  getDashboardStats: () => api.get<AdminDashboardStats>("/admin/dashboard/stats"),

  // Alerts
  getAlerts: (page = 1, limit = 10, severity?: string, status?: string) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (severity) params.append("severity", severity);
    if (status) params.append("status", status);
    return api.get<{ items: AdminAlert[]; total: number }>(`/admin/alerts?${params.toString()}`);
  },

  // Tasks
  getTasks: () => api.get<AdminTask[]>("/admin/tasks"),

  // Incidents
  getIncidents: () => api.get<AdminIncident[]>("/admin/incidents"),

  // Messages
  getUnreadMessages: () => api.get<AdminMessage[]>("/admin/messages/unread"),
  getLatestMessages: () => api.get<AdminMessage[]>("/admin/messages/latest-received"),

  // Inventory
  getInventoryStats: () => api.get<{ totalItems: number; lowStockItems: number; outOfStockItems: number; activeItems: number; totalValue: number }>("/admin/inventory/stats"),
  getLowStockItems: () => api.get<AdminInventoryItem[]>("/admin/inventory/low-stock"),
};