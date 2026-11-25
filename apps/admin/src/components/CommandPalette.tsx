import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  HardHat,
  Moon,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import { WORKSPACE_NAV_GROUPS } from "@/lib/workspaceNav";
import {
  filterCommandItems,
  type CommandPaletteItem,
} from "@/lib/workspaceFeatures";
import { incidentApi } from "@/services/incidentApi";
import { risksApi } from "@/services/risksApi";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPdfReport: () => void;
}

const COPY = {
  fr: {
    title: "Navigation rapide",
    desc: "Recherchez un module, un incident, un risque ou une action rapide.",
    placeholder: "Rechercher un module, un incident (INC-...), un risque...",
    empty: "Aucun résultat pour cette recherche.",
    groups: {
      navigation: "Modules de l'espace",
      actions: "Actions rapides",
      incidents: "Incidents récents",
      risks: "Registre des risques",
    },
    exportPdf: "Exporter le rapport PDF ISO 45001",
    exportPdfSub: "Ouvrir l'aperçu imprimable et sauvegarder en PDF",
    toggleDark: "Activer le mode sombre",
    toggleLight: "Activer le mode clair",
    toggleThemeSub: "Basculer l'interface entre le thème clair et sombre",
    switchEmployee: "Passer en vue Employé (Démo)",
    switchEmployeeSub: "Tester la déclaration d'incident et le contrôle d'accès",
    openSettings: "Paramètres du compte",
    openSettingsSub: "Préférences d'accessibilité, langue et sécurité",
    hint: "↑↓ naviguer · Entrée ouvrir · Échap fermer",
  },
  en: {
    title: "Quick Command Palette",
    desc: "Jump directly to any OHS module, recent incident, risk, or quick action.",
    placeholder: "Search modules, incidents (INC-...), risks, or actions...",
    empty: "No matching modules or records found.",
    groups: {
      navigation: "Workspace Modules",
      actions: "Quick Actions",
      incidents: "Recent Incidents",
      risks: "Risk Register",
    },
    exportPdf: "Export ISO 45001 PDF Report",
    exportPdfSub: "Open print-ready executive safety report preview",
    toggleDark: "Switch to Dark Mode",
    toggleLight: "Switch to Light Mode",
    toggleThemeSub: "Toggle between light and industrial night-shift theme",
    switchEmployee: "Switch to Employee Demo View",
    switchEmployeeSub: "Experience field incident reporting and RBAC boundaries",
    openSettings: "Account Settings",
    openSettingsSub: "Accessibility, language, and notification preferences",
    hint: "↑↓ navigate · Enter open · Esc close",
  },
  ar: {
    title: "لوحة الأوامر السريعة",
    desc: "انتقل مباشرة إلى أي وحدة سلامة أو حادث أو خطر أو إجراء سريع.",
    placeholder: "ابحث في الوحدات أو الحوادث أو المخاطر...",
    empty: "لا توجد نتائج مطابقة للبحث.",
    groups: {
      navigation: "وحدات المنصة",
      actions: "إجراءات سريعة",
      incidents: "الحوادث الأخيرة",
      risks: "سجل المخاطر",
    },
    exportPdf: "تصدير تقرير ISO 45001 بصيغة PDF",
    exportPdfSub: "فتح معاينة التقرير القابل للطباعة والحفظ",
    toggleDark: "تفعيل الوضع الداكن",
    toggleLight: "تفعيل الوضع الفاتح",
    toggleThemeSub: "التبديل بين المظهر الفاتح والوضع الليلي",
    switchEmployee: "التبديل إلى عرض الموظف (تجريبي)",
    switchEmployeeSub: "اختبار الإبلاغ عن الحوادث وصلاحيات الموظفين",
    openSettings: "إعدادات الحساب",
    openSettingsSub: "إعدادات اللغة وسهولة الوصول والإشعارات",
    hint: "↑↓ تنقل · Enter فتح · Esc إغلاق",
  },
} as const;

const CommandPalette = ({
  open,
  onOpenChange,
  onOpenPdfReport,
}: CommandPaletteProps) => {
  const { t } = useTranslation();
  const locale = usePublicLocale();
  const copy = COPY[locale];
  const navigate = useNavigate();
  const { isDemoSession, loginDemo } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [liveItems, setLiveItems] = useState<CommandPaletteItem[]>([]);
  const fetchedRef = useRef(false);

  // Register global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  // Reset search on close; lazy-load recent incidents & risks on first open
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    Promise.allSettled([
      incidentApi.list({ page: 1, limit: 6 }),
      risksApi.list({ page: 1, limit: 6 }),
    ]).then(([incRes, riskRes]) => {
      const dynamic: CommandPaletteItem[] = [];
      if (incRes.status === "fulfilled") {
        for (const inc of incRes.value.data.data ?? []) {
          dynamic.push({
            id: `inc-${inc.id}`,
            group: "incidents",
            title: `${inc.incidentId} · ${inc.zone || inc.type}`,
            subtitle: inc.description?.slice(0, 80) || inc.status,
            keywords: [inc.incidentId, inc.type, inc.severity, inc.status, inc.zone ?? ""],
            to: "/incidents/manage",
          });
        }
      }
      if (riskRes.status === "fulfilled") {
        for (const risk of riskRes.value.data.data ?? []) {
          dynamic.push({
            id: `risk-${risk.id}`,
            group: "risks",
            title: risk.title,
            subtitle: `${risk.zone || ""} · ${risk.level || ""}`.replace(/^ · | · $/g, ""),
            keywords: [risk.title, risk.hazardCategory ?? "", risk.zone ?? "", risk.level ?? ""],
            to: "/risks",
          });
        }
      }
      setLiveItems(dynamic);
    });
  }, [open]);

  const baseItems = useMemo<CommandPaletteItem[]>(() => {
    const navItems: CommandPaletteItem[] = WORKSPACE_NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => ({
        id: `nav-${item.id}`,
        group: "navigation" as const,
        title: t(item.labelKey),
        subtitle: group.titles[locale],
        keywords: [item.id, item.to, group.titles[locale]],
        to: item.to,
      }))
    );

    const actions: CommandPaletteItem[] = [
      {
        id: "action-theme",
        group: "actions",
        title: isDark ? copy.toggleLight : copy.toggleDark,
        subtitle: copy.toggleThemeSub,
        keywords: ["dark", "light", "theme", "sombre", "clair", "mode", "night"],
        actionId: "toggle-theme",
      },
      {
        id: "action-pdf",
        group: "actions",
        title: copy.exportPdf,
        subtitle: copy.exportPdfSub,
        keywords: ["pdf", "print", "iso 45001", "report", "rapport", "export"],
        actionId: "pdf",
      },
      {
        id: "action-settings",
        group: "actions",
        title: copy.openSettings,
        subtitle: copy.openSettingsSub,
        keywords: ["settings", "parametres", "contrast", "theme"],
        to: "/settings",
      },
    ];

    if (isDemoSession) {
      actions.unshift({
        id: "action-switch-employee",
        group: "actions",
        title: copy.switchEmployee,
        subtitle: copy.switchEmployeeSub,
        keywords: ["demo", "employee", "employe", "role", "rbac"],
        actionId: "switch-employee",
      });
    }

    return [...navItems, ...actions, ...liveItems];
  }, [t, locale, copy, isDemoSession, isDark, liveItems]);

  const filtered = useMemo(
    () => filterCommandItems(baseItems, query),
    [baseItems, query]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const executeItem = async (item: CommandPaletteItem) => {
    onOpenChange(false);
    if (item.actionId === "toggle-theme") {
      toggleTheme();
      return;
    }
    if (item.actionId === "pdf") {
      onOpenPdfReport();
      return;
    }
    if (item.actionId === "switch-employee") {
      try {
        await loginDemo("employee");
        navigate("/incidents");
      } catch {
        // Handled by AuthContext
      }
      return;
    }
    if (item.to) {
      navigate(item.to);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      void executeItem(filtered[activeIndex]);
    }
  };

  const groupOrder: CommandPaletteItem["group"][] = [
    "navigation",
    "actions",
    "incidents",
    "risks",
  ];

  const renderGroupIcon = (item: CommandPaletteItem) => {
    if (item.group === "incidents") return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />;
    if (item.group === "risks") return <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />;
    if (item.actionId === "toggle-theme") {
      return isDark ? (
        <Sun className="h-4 w-4 text-amber-400 shrink-0" />
      ) : (
        <Moon className="h-4 w-4 text-prosafe-600 shrink-0" />
      );
    }
    if (item.actionId === "pdf") return <FileText className="h-4 w-4 text-prosafe-600 dark:text-prosafe-400 shrink-0" />;
    if (item.actionId === "switch-employee") return <HardHat className="h-4 w-4 text-prosafe-600 dark:text-prosafe-400 shrink-0" />;
    if (item.group === "actions") return <SlidersHorizontal className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />;
    return <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 rtl:rotate-180" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="command-palette"
        className="max-w-xl p-0 gap-0 overflow-hidden dark:bg-slate-900 dark:border-slate-800"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.desc}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 ps-4 pe-11 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={copy.placeholder}
            aria-label={copy.placeholder}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {copy.empty}
            </div>
          ) : (
            groupOrder.map((groupKey) => {
              const items = filtered.filter((i) => i.group === groupKey);
              if (items.length === 0) return null;
              return (
                <div key={groupKey}>
                  <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {copy.groups[groupKey]}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const flatIdx = filtered.findIndex((x) => x.id === item.id);
                      const isActive = flatIdx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`command-item-${item.id}`}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          onClick={() => void executeItem(item)}
                          className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-start transition-colors ${
                            isActive
                              ? "bg-prosafe-50 text-prosafe-900 dark:bg-prosafe-500/20 dark:text-white"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                          }`}
                        >
                          {renderGroupIcon(item)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{copy.hint}</span>
          <span className="font-mono tabular-nums">{filtered.length}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
