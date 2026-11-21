import api from "./api";
import type { Paginated } from "./incidentApi";

export interface PersonRef {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  sender?: PersonRef | null;
  body: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  subject: string;
  participants: (PersonRef & { roles?: string[] })[];
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}

/** Legacy announcements (`/messages`). */
export interface Announcement {
  id: number;
  subject?: string | null;
  content: string;
  status?: string;
  created_at: string;
  sender?: { firstName?: string | null; lastName?: string | null; email?: string } | null;
  recipient_id?: number;
}

export const personName = (p?: PersonRef | null) =>
  [p?.firstName, p?.lastName].filter(Boolean).join(" ").trim();

export const fetchConversations = async (): Promise<Conversation[]> => {
  const res = await api.get("/conversations", { params: { limit: 100 } });
  const body = res.data as Paginated<Conversation> | Conversation[];
  return Array.isArray(body) ? body : body.data;
};

export const fetchConversation = async (id: number | string): Promise<Conversation> =>
  (await api.get(`/conversations/${id}`)).data;

export const createConversation = async (input: {
  subject: string;
  body: string;
  recipientId?: number;
}): Promise<Conversation> => (await api.post("/conversations", input)).data;

export const fetchThread = async (id: number | string): Promise<ChatMessage[]> => {
  const res = await api.get(`/conversations/${id}/messages`, { params: { limit: 200 } });
  const body = res.data as Paginated<ChatMessage> | ChatMessage[];
  return Array.isArray(body) ? body : body.data;
};

export const sendMessage = async (id: number | string, body: string): Promise<ChatMessage> =>
  (await api.post(`/conversations/${id}/messages`, { body })).data;

export const markConversationRead = async (id: number | string) => {
  await api.patch(`/conversations/${id}/read`);
};

export const fetchAnnouncements = async (): Promise<Announcement[]> =>
  (await api.get("/messages/my-messages")).data;

export const markAnnouncementRead = async (id: number | string) => {
  await api.patch(`/messages/${id}/read`);
};
