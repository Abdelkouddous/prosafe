// this is the admin dashboard UI contains all logics necessary for dashboard
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Bell,
  Settings,
  Home,
  Users,
  Lock,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CheckCircle,
  ShieldCheck,
  Trash2,
  UserCog,
  LockOpen,
  MessageSquare,
  AlertTriangle,
  User,
  Box,
  GraduationCap,
  Send,
  ClipboardCheck,
  BarChart3,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, Navigate } from "react-router-dom";
import api from "@/services/api";

import { useToast } from "@/components/ui/use-toast";
// 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// inventory stats card (full inventory lives at /equipment)
import { inventoryApi, InventoryStats } from "@/services/inventoryApi";
import NotificationPreferences from "@/components/NotificationPreferences";
import NotificationBell from "@/components/NotificationBell";
import NotificationSettings from "@/components/NotificationSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import AdminNotifications from "@/components/AdminNotifications";
import Overview from "@/components/dashboard/Overview";
import { statsApi } from "@/services/statsApi";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}


const Dashboard = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  // This is the inventory management concept
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(
    null
  );
  useEffect(() => {
    inventoryApi
      .getStats()
      .then((res) => setInventoryStats(res.data))
      .catch((error) => console.error("Error fetching inventory stats:", error));
  }, []);

  // alert stats fetch
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [incidentStats, setIncidentStats] = useState({ open: 0, investigating: 0 });
  const unreadMessageCount = useUnreadMessages();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAdmin = !!user?.roles?.includes("admin");

  useEffect(() => {
    statsApi
      .overview()
      .then((res) =>
        setIncidentStats({
          open: res.data.incidents.open,
          investigating: res.data.incidents.investigating,
        })
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/auth/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (window.confirm(`Are you sure you want to delete user ${email}?`)) {
      try {
        await api.delete(`/auth/users/${email}`);
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    }
  };

  const handleApproveUser = async (email: string) => {
    try {
      await api.put(`/auth/users/${email}/approve`);
      toast({
        title: "Success",
        description: "User approved successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async (email: string) => {
    try {
      await api.put(`/auth/users/${email}/block`);
      toast({
        title: "Success",
        description: "User blocked successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    }
  };

  const handleUnblockUser = async (email: string) => {
    try {
      await api.put(`/auth/users/${email}/unblock`);
      toast({
        title: "Success",
        description: "User unblocked successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    }
  };

  const handleMakeAdmin = async (email: string) => {
    try {
      await api.put(`/auth/users/${email}/make-admin`);
      toast({
        title: "Success",
        description: "User is now an admin",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error making user admin:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const openChangeRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.roles[0]);
    setOpenRoleDialog(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      await api.put(`/auth/users/${selectedUser.email}/role`, {
        role: selectedRole,
      });
      toast({
        title: "Success",
        description: `User role changed to ${selectedRole}`,
      });
      setOpenRoleDialog(false);
      fetchUsers();
    } catch (error) {
      console.error("Error changing user role:", error);
      toast({
        title: "Error",
        description: "Failed to change user role",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      // API call to update profile
      const response = await api.patch("/users/profile", {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        department: profileData.department,
      });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditingProfile(false);
      // Update user context if needed
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await api.patch("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    department: "",
    position: "",
    bio: "",
  });
  const renderDashboardContent = () => (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">
          {t("adminDashboard.welcome_back", {
            firstName: user?.firstName || "User",
          })}
        </h2>
        <p className="text-gray-600">
          {t("adminDashboard.dashboard_description")}
        </p>
      </div>
      <Overview />
    </>
  );
  const getTabTitle = () => {
    switch (activeTab) {
      case "overview":
        return t("adminDashboard.page_titles.security_dashboard");
      case "users":
        return t("navigation.userManagement");
      case "incidents":
        return t("navigation.incidents");
      case "profile":
        return t("navigation.myProfile");
      case "user-settings":
        return t("navigation.settings");
      case "messages":
        return t("adminDashboard.sidebar.messages");
      case "notifications":
        return t("adminDashboard.sidebar.notificationSettings");
      case "admin-notifications":
        return t("adminDashboard.sidebar.sendNotifications");
      default:
        return t("adminDashboard.page_titles.security_dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white border-r border-gray-200`}
      >
        <div className="p-4 border-b flex items-center gap-2">
          <Shield className="h-6 w-6 text-prosafe-600" />
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-prosafe-900">PROSAFE</span>
          </Link>
          <button
            className="ml-auto md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setActiveTab("overview")}
          >
            <Home className="mr-2 h-5 w-5" />
            {t("adminDashboard.sidebar.dashboard")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => navigate("/incidents/manage")}
          >
            <AlertTriangle className="mr-2 h-5 w-5" />
            Incidents
            <span className="ml-auto bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {incidentStats?.open + incidentStats?.investigating || 0}
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => navigate("/corrective-actions")}
          >
            <ClipboardCheck className="mr-2 h-5 w-5" />
            {t("navigation.correctiveActions")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => navigate("/alerts")}
          >
            <Bell className="mr-2 h-5 w-5" />
            {t("navigation.alerts")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => navigate("/reports")}
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            {t("navigation.reports")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => navigate("/rewards")}
          >
            <Trophy className="mr-2 h-5 w-5" />
            {t("navigation.rewards")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("users")}
          >
            <Users className="mr-2 h-5 w-5" />
            {t("adminDashboard.sidebar.users")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => navigate("/messages")}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            {t("adminDashboard.sidebar.messages")}
            {unreadMessageCount > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {unreadMessageCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => navigate("/equipment")}
          >
            <Box className="mr-2 h-5 w-5" />
            {t("navigation.inventory")}
            {(inventoryStats?.lowStockItems ?? 0) > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {(inventoryStats?.lowStockItems ?? 0)}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => navigate("/trainings")}
          >
            <GraduationCap className="mr-2 h-5 w-5" />
            {t("navigation.training")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("notifications")}
          >
            <Bell className="mr-2 h-5 w-5" />
            {t("adminDashboard.sidebar.notificationSettings")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("admin-notifications")}
          >
            <Send className="mr-2 h-5 w-5" />
            {t("adminDashboard.sidebar.sendNotifications")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("profile")}
          >
            <User className="mr-2 h-5 w-5" />
            {t("navigation.myProfile")}
          </Button>

          <div className="pt-6 mt-6 border-t border-gray-100">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {t("adminDashboard.sidebar.logout")}
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header with Access Control Menu */}
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="mr-4 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold">{getTabTitle()}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Go to Home Link */}
            <Link
              to="/"
              className="text-sm font-medium hover:text-prosafe-600 transition-colors flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              {t("navigation.goToHome")}
            </Link>

            <NotificationBell />

            {/* Access Control Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 text-sm font-medium hover:text-prosafe-600 transition-colors p-2 rounded-md hover:bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-prosafe-100 flex items-center justify-center text-prosafe-600 font-semibold">
                  {user?.firstName?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "User"}
                </div>
                <span className="hidden sm:block">{user?.firstName}</span>
                {isAdmin && (
                  <span className="hidden sm:block text-xs bg-prosafe-100 text-prosafe-800 px-2 py-1 rounded">
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
                      <button
                        onClick={() => {
                          setActiveTab("profile");
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <User className="h-4 w-4" />
                        {t("navigation.myProfile")}
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("user-settings");
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Settings className="h-4 w-4" />
                        User Settings
                      </button>

                      {/* Admin-only access control links */}
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>
                          <div className="px-4 py-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Admin Access
                            </p>
                          </div>
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
                        {t("adminDashboard.sidebar.logout")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6 bg-background">
          {activeTab === "users" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  User Management
                </h2>
                <p className="text-muted-foreground">
                  Manage user accounts, roles, and permissions.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    View and manage all registered users in the system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-6">
                      Loading users...
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.isActive ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-red-700 border-red-200"
                                >
                                  <Lock className="h-3.5 w-3.5 mr-1" />
                                  Blocked
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.roles.includes("admin") ? (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                  Admin
                                </Badge>
                              ) : user.roles.includes("pending") ? (
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                                >
                                  Pending
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  {user.roles.includes("sst_manager")
                                    ? "SST Manager"
                                    : "Employee"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                {user.roles.includes("pending") && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleApproveUser(user.email)
                                    }
                                    title="Approve User"
                                    className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}

                                {user.isActive ? (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleBlockUser(user.email)}
                                    title="Block User"
                                    className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleUnblockUser(user.email)
                                    }
                                    title="Unblock User"
                                    className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <LockOpen className="h-4 w-4" />
                                  </Button>
                                )}

                                {isAdmin && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openChangeRoleDialog(user)}
                                  title="Change Role"
                                  className="h-8 w-8"
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                                )}

                                {isAdmin && !user.roles.includes("admin") && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleMakeAdmin(user.email)}
                                    title="Make Admin"
                                    className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                  </Button>
                                )}

                                {isAdmin && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteUser(user.email)}
                                  title="Delete User"
                                  className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {t("navigation.myProfile")}
                </h2>
                <p className="text-muted-foreground">
                  Manage your personal information and account details.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Information Card */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                          Update your personal details and contact information.
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                      >
                        {isEditingProfile ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          First Name
                        </label>
                        <Input
                          value={profileData.firstName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              firstName: e.target.value,
                            })
                          }
                          disabled={!isEditingProfile}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Name</label>
                        <Input
                          value={profileData.lastName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              lastName: e.target.value,
                            })
                          }
                          disabled={!isEditingProfile}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Email Address
                      </label>
                      <Input
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        disabled={!isEditingProfile}
                        className="mt-1"
                        type="email"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          Phone Number
                        </label>
                        <Input
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              phone: e.target.value,
                            })
                          }
                          disabled={!isEditingProfile}
                          className="mt-1"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Department
                        </label>
                        <Input
                          value={profileData.department}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              department: e.target.value,
                            })
                          }
                          disabled={!isEditingProfile}
                          className="mt-1"
                          placeholder="IT Security"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Position/Title
                      </label>
                      <Input
                        value={profileData.position}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            position: e.target.value,
                          })
                        }
                        disabled={!isEditingProfile}
                        className="mt-1"
                        placeholder="Security Administrator"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            bio: e.target.value,
                          })
                        }
                        disabled={!isEditingProfile}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md resize-none"
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    {isEditingProfile && (
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleProfileUpdate}
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingProfile(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Profile Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                          {user?.firstName?.charAt(0)}
                          {user?.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {user?.firstName} {user?.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {user?.roles.map((role, index) => (
                            <Badge key={index} variant="outline">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Member since:
                        </span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Last login:
                        </span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Account status:
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700"
                        >
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="password" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="password">
                        Change Password
                      </TabsTrigger>
                      <TabsTrigger value="notifications">
                        Notifications
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="password" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            Current Password
                          </label>
                          <Input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            New Password
                          </label>
                          <Input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Confirm New Password
                          </label>
                          <Input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button onClick={handlePasswordChange} disabled={loading}>
                        {loading ? "Changing..." : "Change Password"}
                      </Button>
                    </TabsContent>

                    <TabsContent
                      value="notifications"
                      className="space-y-4 mt-4"
                    >
                      <NotificationPreferences />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "user-settings" ? (
            <Navigate to="/settings" replace />
          ) : activeTab === "notifications" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {t("adminDashboard.sidebar.notificationSettings")}
                </h2>
                <p className="text-muted-foreground">
                  Configure notification rules and manage training reminders.
                </p>
              </div>
              <NotificationSettings />
            </div>
          ) : activeTab === "admin-notifications" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {t("adminDashboard.sidebar.sendNotifications")}
                </h2>
                <p className="text-muted-foreground">
                  Send important announcements and notifications to all users.
                </p>
              </div>
              <AdminNotifications />
            </div>
          ) : (
            renderDashboardContent()
          )}
        </main>
      </div>

      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsUserMenuOpen(false)}
        ></div>
      )}

      {/* Change Role Dialog */}
      <Dialog open={openRoleDialog} onOpenChange={setOpenRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change role for user: {selectedUser?.firstName || "N/A"}{" "}
              {selectedUser?.lastName || "N/A"} ({selectedUser?.email || "N/A"})
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="sst_manager">SST Manager</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
