import { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Shield } from "lucide-react";
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
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Shield className="h-6 w-6 text-prosafe-600" />
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-prosafe-600"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("manager.backToDashboard")}
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
        <nav className="flex flex-wrap gap-1 border-b">
          {nav.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
                  isActive
                    ? "border-prosafe-600 text-prosafe-700"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        {children}
      </main>
    </div>
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
