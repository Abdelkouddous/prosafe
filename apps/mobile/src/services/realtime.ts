import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";
import { storage } from "./storage";

/**
 * Realtime singleton (Socket.IO namespace `/ws` at the API origin).
 * connectRealtime() after login, disconnectRealtime() on logout.
 * Never throws; screens fall back to polling when `isRealtimeConnected()` is false.
 */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

type Handler = (payload: any) => void;
const listeners = new Map<string, Set<Handler>>();
const statusListeners = new Set<(connected: boolean) => void>();
let socket: Socket | null = null;

const emitStatus = () => {
  const c = isRealtimeConnected();
  statusListeners.forEach((l) => l(c));
};

const attach = (s: Socket) => {
  for (const event of ["message:new", "notification:new"]) {
    s.on(event, (payload: unknown) => {
      listeners.get(event)?.forEach((h) => h(payload));
    });
  }
  s.on("connect", emitStatus);
  s.on("disconnect", emitStatus);
  s.on("connect_error", emitStatus);
};

export const isRealtimeConnected = () => !!socket?.connected;

export const connectRealtime = async (): Promise<void> => {
  if (socket) return;
  try {
    const token = await storage.getToken();
    if (!token || socket) return;
    socket = io(`${API_ORIGIN}/ws`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
    });
    attach(socket);
  } catch {
    socket = null;
  }
};

export const disconnectRealtime = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  emitStatus();
};

export const onRealtime = (event: "message:new" | "notification:new", handler: Handler) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  return () => {
    listeners.get(event)?.delete(handler);
  };
};

export const onRealtimeStatus = (listener: (connected: boolean) => void) => {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};
