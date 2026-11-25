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
  Bell,
  Users,
  Lock,
  CheckCircle,
  ShieldCheck,
  Trash2,
  UserCog,
  LockOpen,
  User,
  Send,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import api from "@/services/api";

import { useToast } from "@/components/ui/use-toast";
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

import NotificationPreferences from "@/components/NotificationPreferences";
import NotificationSettings from "@/components/NotificationSettings";
import WorkspaceShell from "@/components/WorkspaceShell";
import SafetyReportPdfModal from "@/components/SafetyReportPdfModal";
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
import { usePublicLocale } from "@/lib/publicSiteCopy";

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
  const locale = usePublicLocale();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const isAdmin = !!user?.roles?.includes("admin");

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
      await api.patch("/users/profile", {
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


  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    department: "",
    position: "",
    bio: "",
  });
  const renderDashboardContent = () => <Overview />;
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

  const dashboardTabs = [
    {
      id: "overview",
      label: t("adminDashboard.sidebar.dashboard"),
      icon: LayoutDashboard,
    },
    {
      id: "users",
      label: t("adminDashboard.sidebar.users"),
      icon: Users,
    },
    {
      id: "notifications",
      label: t("adminDashboard.sidebar.notificationSettings"),
      icon: Bell,
    },
    {
      id: "admin-notifications",
      label: t("adminDashboard.sidebar.sendNotifications"),
      icon: Send,
    },
    {
      id: "profile",
      label: t("navigation.myProfile"),
      icon: User,
    },
  ];

  const pdfBtnLabel =
    locale === "fr"
      ? "Rapport PDF ISO 45001"
      : locale === "ar"
        ? "تقرير ISO 45001 PDF"
        : "ISO 45001 PDF Report";

  return (
    <WorkspaceShell
      title={getTabTitle()}
      actions={
        <Button
          variant="outline"
          onClick={() => setPdfOpen(true)}
          data-testid="dashboard-pdf-btn"
          className="whitespace-nowrap shrink-0"
        >
          <FileText className="h-4 w-4 me-2 text-prosafe-600" />
          {pdfBtnLabel}
        </Button>
      }
    >
      {/* Horizontal Workspace Sub-Tabs for Dashboard Views */}
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="mb-6 border-b border-slate-200 flex items-center gap-1 overflow-x-auto"
      >
        {dashboardTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-sm whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                active
                  ? "border-prosafe-600 text-prosafe-700 font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dashboard Content */}
      <div>
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
      </div>

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

      <SafetyReportPdfModal open={pdfOpen} onOpenChange={setPdfOpen} />
    </WorkspaceShell>
  );
};

export default Dashboard;
