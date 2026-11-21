import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/auth";

/** API origin without the `/api` suffix (Socket.IO namespace `/ws` lives there). */
export const apiOrigin = (): string => {
  const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return base.replace(/\/api\/?$/, "").replace(/\/$/, "");
};

let socket: Socket | null = null;
let currentToken: string | null = null;

/** Shared realtime connection; recreated when the token changes. */
export function getSocket(): Socket | null {
  const token = getToken();
  if (!token) {
    disconnectSocket();
    return null;
  }
  if (socket && currentToken === token) return socket;
  disconnectSocket();
  currentToken = token;
  socket = io(`${apiOrigin()}/ws`, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 10,
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  currentToken = null;
}
