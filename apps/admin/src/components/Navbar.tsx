import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Shield,
  AlertTriangle,
  Box,
  GraduationCap,
  LogOut,
  User,
  LayoutDashboard,
  Home,
  Settings,
  Users,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.roles.includes("admin");
  const isDashboard = location.pathname.startsWith("/dashboard");

  // Add the missing changeLanguage function
  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserMenuOpen(false);
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-prosafe-600" />
            <span className="text-xl font-bold text-gray-900">PROSAFE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isDashboard && isAdmin ? (
              // Dashboard navigation

              <Link
                to="/"
                className="text-sm font-medium hover:text-prosafe-600 transition-colors flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                {t("navigation.goToHome")}
              </Link>
            ) : (
              // Regular navigation
              <>
                <Link
                  to="/"
                  className="text-sm font-medium hover:text-prosafe-600 transition-colors"
                >
                  {t("navigation.home")}
                </Link>
                {/* <Link
                  to="/about"
                  className="text-sm font-medium hover:text-prosafe-600 transition-colors"
                >
                  {t("navigation.about")}
                </Link>
                <Link
                  to="/services"
                  className="text-sm font-medium hover:text-prosafe-600 transition-colors"
                >
                  {t("navigation.services")}
                </Link>
                <Link
                  to="/contact"
                  className="text-sm font-medium hover:text-prosafe-600 transition-colors"
                >
                  {t("navigation.contact")}
                </Link> */}
              </>
            )}

            {/* Admin-only inventory link */}
            {isAdmin && (
              <Link
                to="/dashboard"
                className="text-sm font-medium hover:text-prosafe-600 transition-colors flex items-center gap-1"
              >
                <Box className="h-4 w-4" />
                {t("navigation.dashboard")}
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <div className="relative group flex">
              <button className="flex items-center gap-1 text-sm font-medium hover:text-prosafe-600 transition-colors p-2 rounded-md hover:bg-gray-100">
                <Globe className="h-4 w-4" />
                <span className="uppercase">{i18n.language}</span>
              </button>
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => changeLanguage("en")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => changeLanguage("fr")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  🇫🇷 Français
                </button>
                <button
                  onClick={() => changeLanguage("ar")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
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
                    className="flex items-center gap-2 text-sm font-medium hover:text-prosafe-600 transition-colors p-2 rounded-md hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    <span>{user?.firstName || "User"}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="p-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {t("navigation.myProfile")}
                          </div>
                        </Link>

                        <Link
                          to="/settings"
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="flex items-center gap-2">
                              <LayoutDashboard className="h-4 w-4" />
                              {t("navigation.dashboard")}
                            </div>
                          </Link>
                        )}

                        {/* User Notifications Section */}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("navigation.notifications")}
                          </div>

                          {/* Incidents - for regular users */}
                          {!isAdmin && (
                            <Link
                              to="/incidents"
                              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                {t("navigation.incidents")}
                              </div>
                            </Link>
                          )}

                          {/* Formations - for all authenticated users */}
                          <Link
                            to="/training"
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              {t("navigation.training")}
                            </div>
                          </Link>

                          {/* Admin-only access control links */}
                          {isAdmin && (
                            <>
                              <Link
                                to="/admin/users"
                                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {t("navigation.userManagement")}
                                </div>
                              </Link>

                              <Link
                                to="/admin/incidents"
                                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  {t("navigation.incidentManagement")}
                                </div>
                              </Link>
                            </>
                          )}
                        </div>

                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                  <Link to="/register">{t("auth.register")}</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="container flex flex-col items-center gap-6 p-6 bg-slate-100 border-slate-400 shadow-md">
            {/* Mobile Language Switcher */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => changeLanguage("en")}
                className={`px-3 py-1 rounded text-sm ${
                  i18n.language === "en"
                    ? "bg-prosafe-600 text-white"
                    : "bg-gray-200"
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

            {/* Mobile navigation based on current page */}
            {isDashboard ? (
              // Dashboard mobile navigation
              isAdmin && (
                <Link
                  to="/"
                  className="text-lg font-medium hover:text-prosafe-600 transition-colors flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Home className="h-5 w-5" />
                  {t("navigation.goToHome")}
                </Link>
              )
            ) : (
              // Regular mobile navigation
              <>
                <Link
                  to="/"
                  className="text-lg font-medium hover:text-prosafe-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navigation.home")}
                </Link>
                <Link
                  to="/about"
                  className="text-lg font-medium hover:text-prosafe-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navigation.about")}
                </Link>
                <Link
                  to="/services"
                  className="text-lg font-medium hover:text-prosafe-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navigation.services")}
                </Link>
                <Link
                  to="/contact"
                  className="text-lg font-medium hover:text-prosafe-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navigation.contact")}
                </Link>
              </>
            )}

            {/* Admin-only mobile inventory link */}
            {isAdmin && (
              <Link
                to="/dashboard"
                className="text-lg font-medium hover:text-prosafe-600 transition-colors flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Box className="h-5 w-5" />
                {t("navigation.dashboard")}
              </Link>
            )}

            {isAuthenticated ? (
              <>
                {/* Mobile User Info */}
                <div className="text-center border-t border-gray-300 pt-4 w-full">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>

                {/* Mobile Access Control Links */}
                <div className="flex flex-col gap-2 w-full">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    {t("navigation.myProfile")}
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    {t("navigation.settings")}
                  </Link>

                  {/* Mobile User Notifications Section */}
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-2 mb-1">
                    {t("navigation.notifications")}
                  </div>

                  {/* Mobile Incidents - for regular users */}
                  {!isAdmin && (
                    <Link
                      to="/incidents"
                      className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {t("navigation.incidents")}
                    </Link>
                  )}

                  {/* Mobile Formations - for all authenticated users */}
                  <Link
                    to="/training"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <GraduationCap className="h-4 w-4" />
                    {t("navigation.training")}
                  </Link>

                  {/* Admin-only mobile access control links */}
                  {isAdmin && (
                    <>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {t("navigation.dashboard")}
                      </Link>

                      <Link
                        to="/admin/users"
                        className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <Users className="h-4 w-4" />
                        {t("navigation.userManagement")}
                      </Link>

                      <Link
                        to="/admin/incidents"
                        className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        {t("navigation.incidentManagement")}
                      </Link>
                    </>
                  )}
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
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    {t("auth.register")}
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
