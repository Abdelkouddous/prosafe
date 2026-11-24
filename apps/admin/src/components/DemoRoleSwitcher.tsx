import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, HardHat } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import type { DemoPersonaRole } from "@/lib/workspaceFeatures";

const LABELS = {
  fr: {
    group: "Changer de rôle démo",
    admin: "Admin HSE",
    employee: "Employé",
  },
  en: {
    group: "Switch demo role",
    admin: "HSE Admin",
    employee: "Employee",
  },
  ar: {
    group: "تبديل دور العرض",
    admin: "مشرف سلامة",
    employee: "موظف",
  },
} as const;

const DemoRoleSwitcher = () => {
  const { isDemoSession, isManager, loginDemo } = useAuth();
  const locale = usePublicLocale();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState<DemoPersonaRole | null>(null);

  if (!isDemoSession) return null;

  const copy = LABELS[locale];
  const currentRole: DemoPersonaRole = isManager ? "admin" : "employee";

  const handleSwitch = async (targetRole: DemoPersonaRole) => {
    if (targetRole === currentRole || switching) return;
    setSwitching(targetRole);
    try {
      await loginDemo(targetRole);
      navigate(targetRole === "employee" ? "/incidents" : "/dashboard");
    } catch {
      // AuthContext handles error toast
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div
      data-testid="demo-role-switcher"
      role="group"
      aria-label={copy.group}
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 shrink-0"
    >
      <button
        type="button"
        onClick={() => handleSwitch("admin")}
        disabled={switching !== null}
        aria-pressed={currentRole === "admin"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
          currentRole === "admin"
            ? "bg-prosafe-600 text-white shadow-sm"
            : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70"
        }`}
      >
        {switching === "admin" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>{copy.admin}</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch("employee")}
        disabled={switching !== null}
        aria-pressed={currentRole === "employee"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
          currentRole === "employee"
            ? "bg-prosafe-600 text-white shadow-sm"
            : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70"
        }`}
      >
        {switching === "employee" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <HardHat className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>{copy.employee}</span>
      </button>
    </div>
  );
};

export default DemoRoleSwitcher;
