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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.roles.includes("admin");
  const isDashboard = location.pathname.startsWith("/dashboard");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky bg-white top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="bg-white container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-prosafe-600" />
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-prosafe-900">PROSAFE</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 bg-white">
          {/* Show different navigation based on current page */}
          {isDashboard ? (
            // Dashboard navigation - only show "Go to Home" for admins
            isAdmin && (
              <Link
                to="/"
                className="text-sm font-medium hover:text-prosafe-600 transition-colors flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </Link>
            )
          ) : (
            // Regular navigation
            <>
              <Link
                to="/"
                className="text-sm font-medium hover:text-prosafe-600 transition-colors"
              >
                Home
              </Link>

              {/* Admin-only links */}
              {isAuthenticated && isAdmin && (
                <>
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium hover:text-prosafe-600 transition-colors flex items-center gap-1"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  {/* Remove this entire Link block for inventory */}
                </>
              )}
              <Link
                to="/inventory"
                className="text-sm font-medium hover:text-prosafe-600 transition-colors flex items-center gap-1"
              >
                <Box className="h-4 w-4" />
                Inventaire
              </Link>
            </>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Access Control Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium hover:text-prosafe-600 transition-colors p-2 rounded-md hover:bg-gray-100"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.firstName}</span>
                  {isAdmin && (
                    <span className="text-xs bg-prosafe-100 text-prosafe-800 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {/* User Info Section */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Role:</span>
                          {user?.roles.map((role, index) => (
                            <span
                              key={index}
                              className={`text-xs px-2 py-1 rounded ${
                                role === "admin"
                                  ? "bg-prosafe-100 text-prosafe-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          My Profile
                        </Link>

                        <Link
                          to="/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>

                        {/* User Notifications Section */}
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Notifications
                          </p>
                        </div>
                        
                        {/* Incidents - for regular users */}
                        {!isAdmin && (
                          <Link
                            to="/incidents"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Incidents
                          </Link>
                        )}
                        
                        {/* Formations - for all authenticated users */}
                        <Link
                          to="/training"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <GraduationCap className="h-4 w-4" />
                          Formations
                        </Link>

                        {/* Admin-only access control links */}
                        {isAdmin && (
                          <>
                            <div className="border-t border-gray-100 my-1"></div>
                            <div className="px-4 py-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Admin Access
                              </p>
                            </div>
                            <Link
                              to="/admin/users"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Users className="h-4 w-4" />
                              User Management
                            </Link>
                            <Link
                              to="/admin/roles"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Shield className="h-4 w-4" />
                              Role Management
                            </Link>
                            <Link
                              to="/admin/permissions"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Settings className="h-4 w-4" />
                              Permissions
                            </Link>
                          </>
                        )}
                      </div>

                      {/* Logout Section */}
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button className="bg-prosafe-600 hover:bg-prosafe-700" asChild>
                <Link to="/login">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex md:hidden bg-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-30 bg-background animate-in md:hidden">
          <nav className="container flex flex-col items-center gap-6 p-6 bg-slate-100 border-slate-400 shadow-md">
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
                  Go to Home
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
                  Home
                </Link>

                {/* Admin-only mobile links */}
                {isAuthenticated && isAdmin && (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-lg font-medium hover:text-prosafe-600 transition-colors flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                    {/* Remove this entire Link block for inventory */}
                  </>
                )}
                <Link
                  to="/inventory"
                  className="text-lg font-medium hover:text-prosafe-600 transition-colors flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Box className="h-5 w-5" />
                  Gestion d'Inventaire
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <div className="flex flex-col gap-4 mt-4 w-full">
                {/* Mobile User Info */}
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{user?.email}</span>
                  <div className="flex items-center gap-2">
                    {user?.roles.map((role, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-1 rounded ${
                          role === "admin"
                            ? "bg-prosafe-100 text-prosafe-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mobile Access Control Links */}
                <div className="flex flex-col gap-2 w-full">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  {/* Mobile User Notifications Section */}
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-2 mb-1">
                    Notifications
                  </div>
                  
                  {/* Mobile Incidents - for regular users */}
                  {!isAdmin && (
                    <Link
                      to="/incidents"
                      className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Incidents
                    </Link>
                  )}
                  
                  {/* Mobile Formations - for all authenticated users */}
                  <Link
                    to="/training"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <GraduationCap className="h-4 w-4" />
                    Formations
                  </Link>

                  {/* Admin-only mobile access control links */}
                  {isAdmin && (
                    <>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-2 mb-1">
                        Admin Access
                      </div>
                      <Link
                        to="/admin/users"
                        className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <Users className="h-4 w-4" />
                        User Management
                      </Link>
                      <Link
                        to="/admin/roles"
                        className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <Shield className="h-4 w-4" />
                        Role Management
                      </Link>
                      <Link
                        to="/admin/permissions"
                        className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Permissions
                      </Link>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    navigate("/");
                  }}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <Button
                  variant="outline"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  className="bg-prosafe-600 hover:bg-prosafe-700"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/login">Get Started</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsUserMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Navbar;
