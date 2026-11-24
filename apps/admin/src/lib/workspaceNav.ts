import type { PublicLocale } from "./publicSiteCopy";

export type WorkspaceNavIconId =
  | "dashboard"
  | "incidents"
  | "correctiveActions"
  | "risks"
  | "audits"
  | "emergency"
  | "equipment"
  | "trainings"
  | "alerts"
  | "reports"
  | "messages"
  | "rewards"
  | "feedback";

export interface WorkspaceNavItem {
  id: WorkspaceNavIconId;
  to: string;
  labelKey: string;
  also?: string[];
  badgeKey?: "unreadMessages" | "openIncidents";
}

export interface WorkspaceNavGroup {
  id: "overview" | "operations" | "assets" | "monitoring";
  titles: Record<PublicLocale, string>;
  items: WorkspaceNavItem[];
}

export const WORKSPACE_NAV_GROUPS: WorkspaceNavGroup[] = [
  {
    id: "overview",
    titles: {
      en: "Overview",
      fr: "Vue d'ensemble",
      ar: "نظرة عامة",
    },
    items: [
      {
        id: "dashboard",
        to: "/dashboard",
        labelKey: "navigation.dashboard",
      },
    ],
  },
  {
    id: "operations",
    titles: {
      en: "Safety Operations",
      fr: "Opérations SST",
      ar: "عمليات السلامة",
    },
    items: [
      {
        id: "incidents",
        to: "/incidents/manage",
        labelKey: "navigation.incidents",
        badgeKey: "openIncidents",
      },
      {
        id: "correctiveActions",
        to: "/corrective-actions",
        labelKey: "navigation.correctiveActions",
      },
      {
        id: "risks",
        to: "/risks",
        labelKey: "navigation.risks",
      },
      {
        id: "audits",
        to: "/audits",
        labelKey: "navigation.audits",
        also: ["/compliance"],
      },
      {
        id: "emergency",
        to: "/emergency",
        labelKey: "navigation.emergency",
      },
    ],
  },
  {
    id: "assets",
    titles: {
      en: "Assets & Workforce",
      fr: "Équipements & Équipes",
      ar: "المعدات والفرق",
    },
    items: [
      {
        id: "equipment",
        to: "/equipment",
        labelKey: "navigation.equipment",
      },
      {
        id: "trainings",
        to: "/trainings",
        labelKey: "navigation.trainings",
      },
    ],
  },
  {
    id: "monitoring",
    titles: {
      en: "Monitoring & Team",
      fr: "Suivi & Équipe",
      ar: "المتابعة والفريق",
    },
    items: [
      {
        id: "alerts",
        to: "/alerts",
        labelKey: "navigation.alerts",
      },
      {
        id: "reports",
        to: "/reports",
        labelKey: "navigation.reports",
      },
      {
        id: "messages",
        to: "/messages",
        labelKey: "navigation.messages",
        badgeKey: "unreadMessages",
      },
      {
        id: "rewards",
        to: "/rewards",
        labelKey: "navigation.rewards",
      },
      {
        id: "feedback",
        to: "/feedback",
        labelKey: "navigation.feedback",
      },
    ],
  },
];

export function isWorkspaceNavActive(
  pathname: string,
  item: Pick<WorkspaceNavItem, "to" | "also">
): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const targets = [item.to, ...(item.also ?? [])];
  return targets.some((target) => {
    const cleanTarget = target.replace(/\/+$/, "") || "/";
    return normalized === cleanTarget || normalized.startsWith(`${cleanTarget}/`);
  });
}

export function formatBadgeCount(count?: number): string | null {
  if (!count || count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}
