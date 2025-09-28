import api from "./api";
import type { User } from "./trainingApi";

// ============ INTERFACES ============
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
  created_by?: AdminUser;
  created_at: string;
  updated_at: string;
  dueDate?: string;
  startDate?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  completed?: boolean;
}

export interface AdminIncident {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  location: string;
  reported_by: AdminUser;
  created_at: string;
  updated_at: string;
}

export interface AdminMessage {
  id: number;
  subject: string;
  content: string;
  sender: AdminUser;
  recipient?: AdminUser;
  status: "unread" | "read" | "archived";
  is_urgent: boolean;
  created_at: string;
}

export interface AdminInventoryItem {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  min_stock_level: number;
  category: string;
  status: string;
  supplier?: string;
  location?: string;
  created_by?: AdminUser;
  updated_by?: AdminUser;
  created_at: string;
  updated_at: string;
}

export interface AdminAlert {
  id: number;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status:
    | "monitoring"
    | "unresolved"
    | "investigating"
    | "resolved"
    | "dismissed";
  type:
    | "security"
    | "system"
    | "network"
    | "user_activity"
    | "compliance"
    | "performance";
  source_ip?: string;
  affected_user?: AdminUser;
  resolved_by?: AdminUser;
  resolved_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============ ADMIN API ============
export const adminApi = {
  // Dashboard Stats
  getDashboardStats: () => {
    return api.get<AdminDashboardStats>("/admin/dashboard/stats");
  },

  // ============ USERS MANAGEMENT ============
  getUsers: () => {
    return api.get<AdminUser[]>("/admin/users");
  },

  getUser: (email: string) => {
    return api.get<AdminUser>(`/admin/users/${email}`);
  },

  createUser: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    return api.post<AdminUser>("/admin/users", data);
  },

  updateUser: (email: string, data: Partial<AdminUser>) => {
    return api.patch<AdminUser>(`/admin/users/${email}`, data);
  },

  deleteUser: (email: string) => {
    return api.delete(`/admin/users/${email}`);
  },

  // ============ MESSAGES MANAGEMENT ============
  getMessages: () => {
    return api.get<AdminMessage[]>("/admin/messages");
  },

  getUnreadMessages: () => {
    return api.get<AdminMessage[]>("/admin/messages/unread");
  },

  getLatestMessages: () => {
    return api.get<AdminMessage[]>("/admin/messages/latest-received");
  },

  getMessage: (id: number) => {
    return api.get<AdminMessage>(`/admin/messages/${id}`);
  },

  createMessage: (data: {
    subject: string;
    content: string;
    recipient_id?: number;
    is_urgent?: boolean;
  }) => {
    return api.post<AdminMessage>("/admin/messages", data);
  },

  updateMessage: (id: number, data: Partial<AdminMessage>) => {
    return api.patch<AdminMessage>(`/admin/messages/${id}`, data);
  },

  markMessageAsRead: (id: number) => {
    return api.patch(`/admin/messages/${id}/read`);
  },

  archiveMessage: (id: number) => {
    return api.patch(`/admin/messages/${id}/archive`);
  },

  deleteMessage: (id: number) => {
    return api.delete(`/admin/messages/${id}`);
  },

  // ============ INVENTORY MANAGEMENT ============
  getInventory: (page = 1, limit = 10, category?: string, status?: string) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (category) params.append("category", category);
    if (status) params.append("status", status);

    return api.get<{
      items: AdminInventoryItem[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/admin/inventory?${params.toString()}`);
  },

  getInventoryStats: () => {
    return api.get<{
      totalItems: number;
      lowStockItems: number;
      outOfStockItems: number;
      activeItems: number;
      totalValue: number;
    }>("/admin/inventory/stats");
  },

  getLowStockItems: () => {
    return api.get<AdminInventoryItem[]>("/admin/inventory/low-stock");
  },

  getInventoryItem: (id: number) => {
    return api.get<AdminInventoryItem>(`/admin/inventory/${id}`);
  },

  createInventoryItem: (data: {
    name: string;
    description: string;
    sku: string;
    price: number;
    quantity: number;
    min_stock_level: number;
    category: string;
    status: string;
    supplier?: string;
    location?: string;
  }) => {
    return api.post<AdminInventoryItem>("/admin/inventory", data);
  },

  updateInventoryItem: (id: number, data: Partial<AdminInventoryItem>) => {
    return api.patch<AdminInventoryItem>(`/admin/inventory/${id}`, data);
  },

  deleteInventoryItem: (id: number) => {
    return api.delete(`/admin/inventory/${id}`);
  },

  // ============ INCIDENTS MANAGEMENT ============
  getIncidents: () => {
    return api.get<AdminIncident[]>("/admin/incidents");
  },

  getIncident: (id: string) => {
    return api.get<AdminIncident>(`/admin/incidents/${id}`);
  },

  createIncident: (data: {
    title: string;
    description: string;
    severity: string;
    location: string;
  }) => {
    return api.post<AdminIncident>("/admin/incidents", data);
  },

  updateIncidentStatus: (
    id: string,
    data: { status: string; notes?: string }
  ) => {
    return api.patch<AdminIncident>(`/admin/incidents/${id}/status`, data);
  },

  // ============ TASKS MANAGEMENT ============
  getTasks: () => {
    return api.get<AdminTask[]>("/admin/tasks");
  },

  getTask: (id: number) => {
    return api.get<AdminTask>(`/admin/tasks/${id}`);
  },

  createTask: (data: {
    title: string;
    description: string;
    priority?: string;
    dueDate?: string;
    startDate?: string;
    location?: string;
    maxParticipants?: number;
  }) => {
    return api.post<AdminTask>("/admin/tasks", data);
  },

  updateTask: (id: number, data: Partial<AdminTask>) => {
    return api.patch<AdminTask>(`/admin/tasks/${id}`, data);
  },

  deleteTask: (id: number) => {
    return api.delete(`/admin/tasks/${id}`);
  },

  completeTask: (id: number) => {
    return api.patch<AdminTask>(`/admin/tasks/${id}/complete`);
  },

  // ============ ALERTS ============
  getAlerts: (page = 1, limit = 10, severity?: string, status?: string) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (severity) params.append("severity", severity);
    if (status) params.append("status", status);

    return api.get<{
      alerts: AdminAlert[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/admin/alerts?${params.toString()}`);
  },

  getAlertStats: () => {
    return api.get<{
      total: number;
      unresolved: number;
      critical: number;
      high: number;
    }>("/admin/alerts/stats");
  },

  getAlert: (id: number) => {
    return api.get<AdminAlert>(`/admin/alerts/${id}`);
  },

  createAlert: (data: {
    title: string;
    description: string;
    severity: string;
    type: string;
    source_ip?: string;
    affected_user_id?: number;
    metadata?: Record<string, unknown>;
  }) => {
    return api.post<AdminAlert>("/admin/alerts", data);
  },

  updateAlert: (id: number, data: Partial<AdminAlert>) => {
    return api.patch<AdminAlert>(`/admin/alerts/${id}`, data);
  },

  deleteAlert: (id: number) => {
    return api.delete(`/admin/alerts/${id}`);
  },
};
