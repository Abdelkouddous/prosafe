import { useEffect, useRef } from "react";
import { getSocket } from "@/services/socket";

/** Subscribes to a Socket.IO event for the lifetime of the component. */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
  enabled = true
) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const s = getSocket();
    if (!s) return;
    const fn = (p: T) => ref.current(p);
    s.on(event, fn);
    return () => {
      s.off(event, fn);
    };
  }, [event, enabled]);
}
