import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { messagingApi } from "@/services/messagingApi";
import { useSocketEvent } from "./useSocketEvent";

const POLL_MS = 15000;

/** Total unread conversation messages; realtime with a 15 s polling fallback. */
export function useUnreadMessages(): number {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setCount(await messagingApi.unreadTotal());
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    const onRead = () => refresh();
    window.addEventListener("prosafe:messages-read", onRead);
    return () => {
      clearInterval(id);
      window.removeEventListener("prosafe:messages-read", onRead);
    };
  }, [isAuthenticated, refresh]);

  useSocketEvent("message:new", refresh, isAuthenticated);
  return count;
}
