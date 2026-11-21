import api from "./api";

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  total: number;
  page: number;
  limit: number;
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

export const notificationApi = {
  list: (params: { unread?: boolean; page?: number; limit?: number } = {}) =>
    api.get<NotificationsResponse>("/notifications", { params }),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
  getPreferences: () =>
    api.get<NotificationPreferences>("/notifications/preferences"),
  updatePreferences: (prefs: NotificationPreferences) =>
    api.put<NotificationPreferences>("/notifications/preferences", prefs),
};
