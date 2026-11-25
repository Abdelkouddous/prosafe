import NotificationBell from "@/components/NotificationBell";
import EmergencyBanner from "@/components/EmergencyBanner";
import DemoRoleSwitcher from "@/components/DemoRoleSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Shield,
  AlertTriangle,
  Box,
  LogOut,
  User,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getHomeRoute } from "@/lib/routeAccess";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = !!(user?.roles?.includes("admin") || user?.roles?.includes("sst_manager"));
  const isDashboard = location.pathname.startsWith("/dashboard");
  const homeRoute = isAuthenticated ? getHomeRoute(user?.roles) : "/";

  // Add the missing changeLanguage function
  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    document.documentElement.dir = languageCode === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = languageCode;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserMenuOpen(false);
    setIsOpen(false);
  };

  return (
    <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to={homeRoute}
            data-testid="navbar-brand-link"
            className="flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Shield className="h-8 w-8 text-prosafe-600 dark:text-prosafe-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">PROSAFE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              isAdmin ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith("/dashboard")
                        ? "text-prosafe-600 dark:text-prosafe-400"
                        : "text-slate-700 dark:text-slate-200 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t("navigation.dashboard")}
                  </Link>
                  <Link
                    to="/incidents/manage"
                    className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith("/incidents")
                        ? "text-prosafe-600 dark:text-prosafe-400"
                        : "text-slate-700 dark:text-slate-200 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {t("navigation.incidents")}
                  </Link>
                  <Link
                    to="/equipment"
                    className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith("/equipment")
                        ? "text-prosafe-600 dark:text-prosafe-400"
                        : "text-slate-700 dark:text-slate-200 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                    }`}
                  >
                    <Box className="h-4 w-4" />
                    {t("navigation.equipment")}
                  </Link>
                  <Link
                    to="/trainings"
                    className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                      location.pathname.startsWith("/trainings")
                        ? "text-prosafe-600 dark:text-prosafe-400"
                        : "text-slate-700 dark:text-slate-200 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                    }`}
                  >
                    {t("navigation.trainings")}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/incidents"
                    className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                      location.pathname === "/incidents"
                        ? "text-prosafe-600 dark:text-prosafe-400"
                        : "text-slate-700 dark:text-slate-200 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {t("navigation.incidents")}
                  </Link>
                  <Link
                    to="/profile"
                    className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                      location.pathname === "/profile"
                        ? "text-prosafe-600 dark:text-prosafe-400"
                        : "text-slate-700 dark:text-slate-200 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                    }`}
                  >
                    {t("navigation.myProfile")}
                  </Link>
                  <Link
                    to="/settings"
                    className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                      location.pathname === "/settings"
                        ? "text-prosafe-600 dark:text-prosafe-400"
                        : "text-slate-700 dark:text-slate-200 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                    }`}
                  >
                    {t("navigation.settings")}
                  </Link>
                </>
              )
            ) : (
              <>
                <Link
                  to="/features"
                  className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    location.pathname === "/features"
                      ? "text-prosafe-600 dark:text-prosafe-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                  }`}
                >
                  {t("footer.features")}
                </Link>
                <Link
                  to="/services"
                  className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    location.pathname === "/services"
                      ? "text-prosafe-600 dark:text-prosafe-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                  }`}
                >
                  {t("navigation.services")}
                </Link>
                <Link
                  to="/pricing"
                  className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    location.pathname === "/pricing"
                      ? "text-prosafe-600 dark:text-prosafe-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                  }`}
                >
                  {t("footer.pricing")}
                </Link>
                <Link
                  to="/about"
                  className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    location.pathname === "/about"
                      ? "text-prosafe-600 dark:text-prosafe-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                  }`}
                >
                  {t("navigation.about")}
                </Link>
                <Link
                  to="/contact"
                  className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    location.pathname === "/contact"
                      ? "text-prosafe-600 dark:text-prosafe-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-prosafe-600 dark:hover:text-prosafe-400"
                  }`}
                >
                  {t("navigation.contact")}
                </Link>
              </>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <DemoRoleSwitcher />
            <ThemeToggle />
            <NotificationBell />
            {/* Language Switcher */}
            <div className="relative group flex">
              <button className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-prosafe-600 dark:hover:text-prosafe-400 transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800">
                <Globe className="h-4 w-4" />
                <span className="uppercase">{i18n.language}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => changeLanguage("en")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => changeLanguage("fr")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  🇫🇷 Français
                </button>
                <button
                  onClick={() => changeLanguage("ar")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  🇩🇿 العربية
                </button>
              </div>
            </div>

            {isAuthenticated ? (
              <>
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-prosafe-600 dark:hover:text-prosafe-400 transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <User className="h-4 w-4" />
                    <span>{user?.firstName || "User"}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md shadow-lg z-50">
                      <div className="p-2 border-b border-gray-100 dark:border-slate-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="block px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {t("navigation.myProfile")}
                          </div>
                        </Link>

                        <Link
                          to="/settings"
                          className="block px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            {t("navigation.settings")}
                          </div>
                        </Link>

                        {/* Dashboard Link for Admin */}
                        {isAdmin && !isDashboard && (
                          <Link
                            to="/dashboard"
                            className="block px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="flex items-center gap-2">
                              <LayoutDashboard className="h-4 w-4" />
                              {t("navigation.dashboard")}
                            </div>
                          </Link>
                        )}

                        {/* User Notifications Section */}
                        <div className="border-t border-gray-100 dark:border-slate-800 mt-1 pt-1">
                          <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                            {t("navigation.notifications")}
                          </div>

                          {/* Incidents - for regular users */}
                          {!isAdmin && (
                            <Link
                              to="/incidents"
                              className="block px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                {t("navigation.incidents")}
                              </div>
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-gray-100 dark:border-slate-800 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-rose-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <LogOut className="h-4 w-4" />
                              {t("auth.logout")}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">{t("auth.login")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/login">{t("auth.register")}</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="container flex flex-col items-center gap-6 p-6 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-md">
            {/* Mobile Language Switcher */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => changeLanguage("en")}
                className={`px-3 py-1 rounded text-sm ${
                  i18n.language === "en"
                    ? "bg-prosafe-600 text-white"
                    : "bg-gray-200 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                🇺🇸 EN
              </button>
              <button
                onClick={() => changeLanguage("fr")}
                className={`px-3 py-1 rounded text-sm ${
                  i18n.language === "fr"
                    ? "bg-prosafe-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                🇫🇷 FR
              </button>
              <button
                onClick={() => changeLanguage("ar")}
                className={`px-3 py-1 rounded text-sm ${
                  i18n.language === "ar"
                    ? "bg-prosafe-600 text-white"
                    : "bg-gray-200"
                } `}
              >
                🇩🇿 AR
              </button>
            </div>

            {/* Mobile navigation: strictly separate guest marketing vs authenticated workspace */}
            {!isAuthenticated && (
              <>
                <Link
                  to="/"
                  className="text-lg font-medium text-slate-800 dark:text-slate-100 hover:text-prosafe-600 dark:hover:text-prosafe-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navigation.home")}
                </Link>
                <Link
                  to="/features"
                  className="text-lg font-medium text-slate-800 dark:text-slate-100 hover:text-prosafe-600 dark:hover:text-prosafe-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("footer.features")}
                </Link>
                <Link
                  to="/services"
                  className="text-lg font-medium text-slate-800 dark:text-slate-100 hover:text-prosafe-600 dark:hover:text-prosafe-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navigation.services")}
                </Link>
                <Link
                  to="/pricing"
                  className="text-lg font-medium text-slate-800 dark:text-slate-100 hover:text-prosafe-600 dark:hover:text-prosafe-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("footer.pricing")}
                </Link>
                <Link
                  to="/about"
                  className="text-lg font-medium text-slate-800 dark:text-slate-100 hover:text-prosafe-600 dark:hover:text-prosafe-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navigation.about")}
                </Link>
                <Link
                  to="/contact"
                  className="text-lg font-medium text-slate-800 dark:text-slate-100 hover:text-prosafe-600 dark:hover:text-prosafe-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navigation.contact")}
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <>
                {/* Mobile User Info */}
                <div className="text-center border-t border-gray-300 dark:border-slate-800 pt-4 w-full flex flex-col items-center gap-2">
                  <DemoRoleSwitcher />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{user?.email}</p>
                </div>

                {/* Mobile Workspace Links */}
                <div className="flex flex-col gap-2 w-full">
                  {isAdmin ? (
                    <>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                        onClick={() => setIsOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {t("navigation.dashboard")}
                      </Link>
                      <Link
                        to="/incidents/manage"
                        className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                        onClick={() => setIsOpen(false)}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        {t("navigation.incidents")}
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/incidents"
                      className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                      onClick={() => setIsOpen(false)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {t("navigation.incidents")}
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    {t("navigation.myProfile")}
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    {t("navigation.settings")}
                  </Link>
                </div>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t("auth.logout")}
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <Button asChild className="w-full">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    {t("auth.login")}
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    {t("auth.register")}
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
      {isAdmin && isAuthenticated && <EmergencyBanner />}
    </nav>
  );
};

export default Navbar;
