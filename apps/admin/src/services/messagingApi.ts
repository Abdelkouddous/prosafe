import api from "./api";

export interface ConversationParticipant {
  id: number;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface Conversation {
  id: number;
  subject: string;
  participants: ConversationParticipant[];
  lastMessage: {
    id: number;
    body: string;
    senderId: number | null;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number | null;
  sender: { id: number; firstName: string; lastName: string } | null;
  body: string;
  createdAt: string;
}

interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const messagingApi = {
  conversations: (page = 1, limit = 50) =>
    api.get<Page<Conversation>>("/conversations", { params: { page, limit } }),
  create: (d: { subject: string; body: string; recipientId?: number }) =>
    api.post<Conversation>("/conversations", d),
  messages: (id: number, page = 1, limit = 200) =>
    api.get<Page<ChatMessage>>(`/conversations/${id}/messages`, {
      params: { page, limit },
    }),
  send: (id: number, body: string) =>
    api.post<ChatMessage>(`/conversations/${id}/messages`, { body }),
  markRead: (id: number) => api.patch(`/conversations/${id}/read`),
  /** Sum of unread messages over the latest conversations. */
  async unreadTotal(): Promise<number> {
    const res = await api.get<Page<Conversation>>("/conversations", {
      params: { page: 1, limit: 100 },
    });
    return res.data.data.reduce((s, c) => s + (c.unreadCount || 0), 0);
  },
};
