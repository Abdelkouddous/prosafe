import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import WorkspaceShell from "@/components/WorkspaceShell";
import { cn } from "@/lib/utils";

export interface ManagerNavLink {
  to: string;
  label: string;
  end?: boolean;
}

interface Props {
  title: string;
  subtitle?: string;
  nav: ManagerNavLink[];
  actions?: ReactNode;
  children: ReactNode;
}

/** Shared shell for back-office manager pages (equipment, trainings). */
export const ManagerPage = ({ title, subtitle, nav, actions, children }: Props) => {
  return (
    <WorkspaceShell title={title} subtitle={subtitle} actions={actions}>
      <div className="space-y-6">
        <nav className="flex flex-wrap gap-1 border-b border-slate-200">
          {nav.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                  isActive
                    ? "border-prosafe-600 text-prosafe-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        {children}
      </div>
    </WorkspaceShell>
  );
};

export const apiErrorMessage = (e: unknown, fallback: string) => {
  const m = (e as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  return Array.isArray(m) ? m.join(", ") : m || fallback;
};

/** yyyy-MM-dd for <input type="date"> from an ISO string. */
export const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");
/** yyyy-MM-ddTHH:mm (local) for <input type="datetime-local">. */
export const toDateTimeInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "—";
export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString() : "—";
