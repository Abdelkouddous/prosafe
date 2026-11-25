import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import {
  notificationApi,
  type AppNotification,
} from "@/services/notificationApi";

const POLL_MS = 60000;

const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isManager } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [list, unreadRes] = await Promise.all([
        notificationApi.list({ page: 1, limit: 15 }),
        notificationApi.list({ unread: true, page: 1, limit: 1 }),
      ]);
      setItems(list.data.data);
      setUnread(unreadRes.data.total);
    } catch {
      // Silent: the bell must never break the page (401 handled by interceptor).
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, refresh]);

  // Instant updates; the 60 s polling above stays as fallback.
  useSocketEvent("notification:new", refresh, isAuthenticated);

  if (!isAuthenticated) return null;

  const onItemClick = async (n: AppNotification) => {
    if (!n.readAt) {
      try {
        await notificationApi.markRead(n.id);
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    const data = n.data as { incidentId?: number | string } | null | undefined;
    if (n.type === "message" && isManager) navigate("/messages");
    else if (n.type === "incident" && isManager) navigate("/incidents/manage");
    else if (data?.incidentId) navigate("/incidents");
    refresh();
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
    } finally {
      refresh();
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) refresh();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("notifications.title")}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -end-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-medium text-sm">{t("notifications.title")}</span>
          <Button variant="ghost" size="sm" onClick={markAll} disabled={unread === 0}>
            <CheckCheck className="h-4 w-4 me-1" />
            {t("notifications.markAllRead")}
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 dark:text-slate-400 text-center">
              {t("notifications.empty")}
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onItemClick(n)}
                className={`w-full text-start px-3 py-2 border-b dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/70 ${
                  n.readAt ? "" : "bg-orange-50 dark:bg-orange-500/10"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.readAt && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                      {n.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2">
                      {n.body}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                      {new Date(n.createdAt).toLocaleString(i18n.language)}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
