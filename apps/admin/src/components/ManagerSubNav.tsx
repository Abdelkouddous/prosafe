import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

/** Secondary navigation for managers (Phase 3 screens). */
const ManagerSubNav = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const unread = useUnreadMessages();

  const items = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("navigation.dashboard") },
    { to: "/incidents/manage", icon: AlertTriangle, label: t("navigation.incidents") },
    { to: "/corrective-actions", icon: ClipboardCheck, label: t("navigation.correctiveActions") },
    { to: "/alerts", icon: Bell, label: t("navigation.alerts") },
    { to: "/reports", icon: BarChart3, label: t("navigation.reports") },
    { to: "/messages", icon: MessageSquare, label: t("navigation.messages"), badge: unread },
    { to: "/rewards", icon: Trophy, label: t("navigation.rewards") },
  ];

  return (
    <div className="border-t border-gray-100 bg-gray-50">
      <div className="container mx-auto px-4 flex gap-1 overflow-x-auto py-1">
        {items.map(({ to, icon: Icon, label, badge }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-white font-semibold text-prosafe-700 shadow-sm"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {!!badge && badge > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ManagerSubNav;
