import api from "./api";
import type { Paginated } from "./incidentApi";

export interface AppNotification {
  id: number | string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  incidents: boolean;
  trainings: boolean;
  audits: boolean;
  inventory: boolean;
  emergency: boolean;
  messages: boolean;
  push: boolean;
  email: boolean;
}

export const fetchNotifications = async (params: {
  unread?: boolean;
  page?: number;
  limit?: number;
} = {}): Promise<Paginated<AppNotification>> => {
  const res = await api.get("/notifications", { params });
  return res.data;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const res = await fetchNotifications({ unread: true, page: 1, limit: 1 });
  return res.total ?? 0;
};

export const markNotificationRead = async (id: number | string) => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  await api.patch("/notifications/read-all");
};

export const registerDevice = async (token: string, platform: string) => {
  await api.post("/notifications/devices", { token, platform });
};

export const unregisterDevice = async (token: string) => {
  await api.delete(`/notifications/devices/${encodeURIComponent(token)}`);
};

export const fetchPreferences = async (): Promise<NotificationPreferences> => {
  const res = await api.get("/notifications/preferences");
  return res.data;
};

export const updatePreferences = async (
  prefs: NotificationPreferences
): Promise<NotificationPreferences> => {
  const res = await api.put("/notifications/preferences", prefs);
  return res.data;
};
