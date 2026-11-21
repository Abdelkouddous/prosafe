import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  EMERGENCY_CHANGED,
  emergencyApi,
  type EmergencyEvent,
} from "@/services/emergencyApi";
import { useSocketEvent } from "./useSocketEvent";

const POLL_MS = 30000;

/** Ongoing emergency events: 30 s polling + realtime `notification:new` of type emergency. */
export function useActiveEmergencies() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EmergencyEvent[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await emergencyApi.events({ active: true, limit: 10 });
      setEvents(res.data.data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    window.addEventListener(EMERGENCY_CHANGED, refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener(EMERGENCY_CHANGED, refresh);
    };
  }, [isAuthenticated, refresh]);

  useSocketEvent<{ type?: string }>(
    "notification:new",
    (n) => {
      if (n?.type === "emergency") refresh();
    },
    isAuthenticated
  );

  return { events, refresh };
}
