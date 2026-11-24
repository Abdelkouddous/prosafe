import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Box,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Globe,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Siren,
  Star,
  Trophy,
  User,
  X,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import EmergencyBanner from "@/components/EmergencyBanner";
import CommandPalette from "@/components/CommandPalette";
import DemoRoleSwitcher from "@/components/DemoRoleSwitcher";
import SafetyReportPdfModal from "@/components/SafetyReportPdfModal";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { usePublicLocale } from "@/lib/publicSiteCopy";
import { statsApi } from "@/services/statsApi";
import {
  WORKSPACE_NAV_GROUPS,
  formatBadgeCount,
  isWorkspaceNavActive,
  type WorkspaceNavIconId,
} from "@/lib/workspaceNav";

const NAV_ICONS: Record<WorkspaceNavIconId, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  incidents: AlertTriangle,
  correctiveActions: ClipboardCheck,
  risks: ShieldAlert,
  audits: ClipboardList,
  emergency: Siren,
  equipment: Box,
  trainings: GraduationCap,
  alerts: Bell,
  reports: BarChart3,
  messages: MessageSquare,
  rewards: Trophy,
  feedback: Star,
};

interface WorkspaceShellProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  fullHeight?: boolean;
}

const WorkspaceShell = ({
  title,
  subtitle,
  actions,
  children,
  fullHeight,
}: WorkspaceShellProps) => {
  const { t, i18n } = useTranslation();
  const locale = usePublicLocale();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const unreadMessages = useUnreadMessages();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [openIncidentsCount, setOpenIncidentsCount] = useState<number>(0);

  // Close mobile drawer when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Fetch active incident count once for sidebar indicator
  useEffect(() => {
    let active = true;
    statsApi
      .overview()
      .then((res) => {
        if (!active) return;
        const inc = res.data?.incidents;
        if (inc) {
          setOpenIncidentsCount((inc.open ?? 0) + (inc.investigating ?? 0));
        }
      })
      .catch(() => {
        // Non-critical sidebar indicator
      });
    return () => {
      active = false;
    };
  }, []);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    document.documentElement.dir = languageCode === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = languageCode;
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate("/login");
  };

  const getBadge = (badgeKey?: "unreadMessages" | "openIncidents") => {
    if (badgeKey === "unreadMessages") return formatBadgeCount(unreadMessages);
    if (badgeKey === "openIncidents") return formatBadgeCount(openIncidentsCount);
    return null;
  };

  const sidebarContent = (isCompact: boolean) => (
    <div className="flex flex-col h-full bg-white">
      {/* Sidebar Brand Header */}
      <div
        className={`h-16 px-4 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 ${
          isCompact ? "justify-center px-2" : ""
        }`}
      >
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 min-w-0 whitespace-nowrap shrink-0"
          title="PROSAFE"
        >
          <Shield className="h-7 w-7 text-prosafe-600 shrink-0" />
          {!isCompact && (
            <span className="text-lg font-bold tracking-tight text-slate-900">PROSAFE</span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Grouped Navigation Links */}
      <nav
        aria-label="Workspace navigation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
      >
        {WORKSPACE_NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            {!isCompact && (
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                {group.titles[locale]}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = NAV_ICONS[item.id];
              const active = isWorkspaceNavActive(pathname, item);
              const badge = getBadge(item.badgeKey);
              const label = t(item.labelKey);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={isCompact ? label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    isCompact ? "justify-center px-2 py-2.5" : "px-3 py-2"
                  } ${
                    active
                      ? "bg-prosafe-50 text-prosafe-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? "text-prosafe-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  {!isCompact && <span className="truncate">{label}</span>}
                  {!isCompact && badge && (
                    <span
                      className={`ms-auto text-xs font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                        item.badgeKey === "openIncidents"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-prosafe-100 text-prosafe-700"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Footer Utilities */}
      <div className="border-t border-slate-200 p-3 space-y-1 shrink-0">
        <Link
          to="/"
          title={isCompact ? t("navigation.goToHome") : undefined}
          className={`flex items-center gap-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap ${
            isCompact ? "justify-center px-2 py-2" : "px-3 py-2"
          }`}
        >
          <Home className="h-4 w-4 text-slate-400 shrink-0" />
          {!isCompact && <span className="truncate">{t("navigation.goToHome")}</span>}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          title={isCompact ? t("auth.logout") : undefined}
          className={`w-full flex items-center gap-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap ${
            isCompact ? "justify-center px-2 py-2" : "px-3 py-2"
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCompact && <span className="truncate">{t("auth.logout")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Persistent Sidebar */}
      <aside
        data-testid="workspace-sidebar"
        className={`hidden lg:flex lg:flex-col shrink-0 border-e border-slate-200 bg-white sticky top-0 h-screen transition-[width] duration-200 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent(collapsed)}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            data-testid="workspace-sidebar-mobile"
            className="relative z-10 w-64 max-w-[82vw] h-full border-e border-slate-200 bg-white shadow-xl"
          >
            {sidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Right Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Top Workspace Utility Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Sidebar Open Trigger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 -ms-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Desktop Sidebar Collapse Toggle */}
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden lg:inline-flex p-2 -ms-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>

              {/* Mobile Brand Mark */}
              <Link
                to="/dashboard"
                className="lg:hidden flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Shield className="h-6 w-6 text-prosafe-600" />
                <span className="font-bold text-slate-900">PROSAFE</span>
              </Link>

              {/* Current Module Context on Desktop */}
              {title && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 min-w-0">
                  <span className="truncate font-medium text-slate-800">{title}</span>
                </div>
              )}
            </div>

            {/* Right Utility Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Quick Command Palette Trigger (Ctrl+K) */}
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                aria-label="Open command palette"
                data-testid="command-palette-trigger"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors whitespace-nowrap"
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline">
                  {locale === "fr" ? "Rechercher..." : locale === "ar" ? "بحث سريع..." : "Quick search..."}
                </span>
                <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                  Ctrl K
                </kbd>
              </button>

              {/* Demo Role Switcher (visible only in demo sessions) */}
              <div className="hidden md:flex">
                <DemoRoleSwitcher />
              </div>

              <NotificationBell />

              {/* Language Switcher */}
              <div className="relative group flex">
                <button
                  type="button"
                  aria-label="Change language"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-prosafe-600 transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100 whitespace-nowrap"
                >
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-xs font-semibold">{locale}</span>
                </button>
                <div className="absolute end-0 top-full pt-1 w-36 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                    <button
                      type="button"
                      onClick={() => changeLanguage("fr")}
                      className="w-full text-start px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                    >
                      Français
                    </button>
                    <button
                      type="button"
                      onClick={() => changeLanguage("en")}
                      className="w-full text-start px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => changeLanguage("ar")}
                      className="w-full text-start px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                    >
                      العربية
                    </button>
                  </div>
                </div>
              </div>

              {/* User Account Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-prosafe-600 transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100 whitespace-nowrap"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.firstName || "Admin"}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute end-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      {t("navigation.myProfile")}
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      {t("navigation.settings")}
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("auth.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <EmergencyBanner />
        </header>

        {/* Main Scrollable Viewport */}
        <main
          className={`flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
            fullHeight ? "" : "pb-12"
          }`}
        >
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                )}
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onOpenPdfReport={() => setPdfModalOpen(true)}
      />
      <SafetyReportPdfModal
        open={pdfModalOpen}
        onOpenChange={setPdfModalOpen}
      />
    </div>
  );
};

export default WorkspaceShell;
