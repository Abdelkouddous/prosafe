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
  ResponsiveContainer,
  LineChart,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  Pie,
  Line,
  BarChart,
  Bar,
} from "recharts";
import {
  Shield,
  Bell,
  Settings,
  Home,
  Users,
  Lock,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  CheckCircle,
  ShieldCheck,
  Trash2,
  UserCog,
  LockOpen,
  MessageSquare,
  AlertTriangle,
  Activity,
  User,
  Box,
  Search,
  PlusCircle,
  RefreshCw,
  MinusCircle,
  Package,
  GraduationCap,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "@/services/api";

import { useToast } from "@/components/ui/use-toast";
// import { alertApi, Alert, AlertStats } from "@/services/alertApi";
import {
  incidentApi,
  Incident as BackendIncident,
  IncidentsResponse,
} from "@/services/incidentApi";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Messages from "@/components/Messages";

// this code refers to the inventory management
import {
  inventoryApi,
  InventoryStats,
  InventoryCategory,
  InventoryItem as BackendInventoryItem,
  CreateInventoryItemDto,
  InventoryStatus,
} from "@/services/inventoryApi";
import InventoryManagement from "@/components/InventoryManagement";
import TrainingManagement from "@/components/TrainingManagement";
import NotificationSettings from "@/components/NotificationSettings";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { t } from "node_modules/i18next";
import { useTranslation } from "react-i18next";
import { alertApi, Alert, AlertStats } from "@/services/alertApi";
import AdminNotifications from "@/components/AdminNotifications";
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

// interface Message {
//   id: number;
//   sender: string;
//   avatar: string;
//   content: string;
//   timestamp: string;
//   unread: boolean;
// }

// Define a more accurate interface for messages fetched from the backend
interface BackendMessage {
  id: number;
  content: string;
  created_at: string; // ISO date string
  status: string; // e.g., 'UNREAD', 'READ'
  sender?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  } | null;
  system_sender?: string; // For system messages like "Prosafe Admin"
  recipient?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

const securityScoreData = [
  { name: "Jan", score: 65 },
  { name: "Feb", score: 68 },
];

const threatData = [
  { name: "Malware", value: 35 },
  { name: "Phishing", value: 25 },
];

// const incidentTrendData = [
//   { name: "Mon", incidents: 5 },
//   { name: "Tue", incidents: 8 },
//   { name: "Sun", incidents: 2 },
// ];

// Add this function to process incident data by month
const getIncidentsByMonth = (incidents: BackendIncident[]) => {
  const monthlyData: { [key: string]: number } = {};
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Initialize all months with 0
  months.forEach((month) => {
    monthlyData[month] = 0;
  });

  // Count incidents by month
  incidents.forEach((incident) => {
    if (incident.created_at) {
      const date = new Date(incident.created_at);
      if (!isNaN(date.getTime())) {
        const month = months[date.getMonth()];
        monthlyData[month]++;
      }
    }
  });

  // Convert to array format for recharts
  return months.map((month) => ({
    month,
    incidents: monthlyData[month],
  }));
};

const THREAT_COLORS = ["#0d47a1", "#1976d2", "#2196f3", "#64b5f6", "#bbdefb"];
const INCIDENT_COLORS = {
  low: "#4CAF50",
  medium: "#FFC107",
  high: "#FF9800",
  critical: "#F44336",
};

// const incidentLogs: Incident[] = [
//   {
//     id: 1,
//     title: "Unauthorized Access Attempt",
//     type: "Authentication",
//     status: "investigating",
//     severity: "high",
//     timestamp: "2023-06-15T14:32:00Z",
//     assignedTo: "John Smith",
//   },
//   {
//     id: 2,
//     title: "Database Connection Issues",
//     type: "Infrastructure",
//     status: "open",
//     severity: "medium",
//     timestamp: "2023-06-15T10:15:00Z",
//     assignedTo: "Sarah Johnson",
//   },
//   {
//     id: 3,
//     title: "Suspicious File Upload",
//     type: "Malware",
//     status: "investigating",
//     severity: "critical",
//     timestamp: "2023-06-14T18:45:00Z",
//     assignedTo: "Michael Chen",
//   },
//   {
//     id: 4,
//     title: "Network Latency Spike",
//     type: "Performance",
//     status: "resolved",
//     severity: "low",
//     timestamp: "2023-06-14T09:20:00Z",
//     assignedTo: "Emma Davis",
//   },
//   {
//     id: 5,
//     title: "Failed Backup Job",
//     type: "Data",
//     status: "open",
//     severity: "medium",
//     timestamp: "2023-06-13T22:10:00Z",
//     assignedTo: "Robert Wilson",
//   },
// ];

// const recentMessages: Message[] = [
//   {
//     id: 1,
//     sender: "John Smith",
//     avatar: "/avatars/john-smith.jpg",
//     content:
//       "I've completed the security audit report. Please review when you get a chance.",
//     timestamp: "10 min ago",
//     unread: true,
//   },
//   {
//     id: 2,
//     sender: "Security Team",
//     avatar: "/avatars/security-team.png",
//     content:
//       "Reminder: All admins must complete the new security training by Friday.",
//     timestamp: "2 hours ago",
//     unread: false,
//   },
//   {
//     id: 3,
//     sender: "Sarah Johnson",
//     avatar: "/avatars/sarah-johnson.jpg",
//     content: "The firewall update has been scheduled for tonight at 10 PM.",
//     timestamp: "4 hours ago",
//     unread: false,
//   },
//   {
//     id: 4,
//     sender: "System Alert",
//     avatar: "/avatars/system-alert.png",
//     content: "New security patch available for deployment.",
//     timestamp: "1 day ago",
//     unread: false,
//   },
// ];

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [alertStats, setAlertStats] = useState<AlertStats>({
    total: 0,
    unresolved: 0,
    resolved: 0,
    monitoring: 0,
    critical: 0,
    high: 0,
  });
  const [latestMessages, setLatestMessages] = useState<BackendMessage[]>([]);
  const [incidents, setIncidents] = useState<BackendIncident[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  // This is the inventory management concept
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(
    null
  );
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<CreateInventoryItemDto>({
    name: "",
    description: "",
    sku: "",
    price: 0,
    quantity: 0,
    min_stock_level: 1,
    category: InventoryCategory.OTHER,
    status: InventoryStatus.ACTIVE,
    supplier: "",
    location: "",
  });
  //
  const categories = [
    t("adminDashboard.categories.allCategories"),
    t("adminDashboard.categories.electronics"),
    t("adminDashboard.categories.officeSupplies"),
    t("adminDashboard.categories.furniture"),
    t("adminDashboard.categories.safetyEquipment"),
    t("adminDashboard.categories.tools"),
    t("adminDashboard.categories.consumables"),
    t("adminDashboard.categories.other"),
  ];

  const handleAddEquipment = async () => {
    try {
      await inventoryApi.createItem(newItem);
      toast({
        title: t("dashboard.equipmentAdded"),
        description: t("dashboard.equipmentAddedDescription"),
      });
      setIsAddModalOpen(false);
      fetchInventoryData();
      setNewItem({
        name: "",
        description: "",
        sku: "",
        price: 0,
        quantity: 0,
        min_stock_level: 1,
        category: InventoryCategory.OTHER,
        status: InventoryStatus.ACTIVE,
        supplier: "",
        location: "",
      });
    } catch (error) {
      toast({
        title: t("dashboard.equipmentAddError"),
        description: t("dashboard.equipmentAddErrorDescription"),
        variant: "destructive",
      });
    }
  };

  const fetchInventoryData = async () => {
    try {
      setInventoryLoading(true);
      const response = await inventoryApi.getItems(1, 100);
      setInventory(response.data.items);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast({
        title: t("errors.error"),
        description: t("errors.inventoryLoadError"),
        variant: "destructive",
      });
    } finally {
      setInventoryLoading(false);
    }
  };

  // Add to useEffect:
  useEffect(() => {
    const fetchInventoryStats = async () => {
      try {
        const response = await inventoryApi.getStats();
        setInventoryStats(response.data);
      } catch (error) {
        console.error("Error fetching inventory stats:", error);
      }
    };

    fetchInventoryStats();
    fetchInventoryData();
  }, []);

  // alert stats fetch
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    securityAlerts: true,
    incidentUpdates: true,
    systemMaintenance: false,
  });

  const [incidentStats, setIncidentStats] = useState({
    total: 0,
    open: 0,
    investigating: 0,
    critical: 0,
  });
  const [inventory, setInventory] = useState<BackendInventoryItem[]>([]);
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [isRefreshingInventory, setIsRefreshingInventory] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAdmin = user?.roles.includes("admin");

  // Calculate unread message count from backend messages
  const unreadMessageCount = latestMessages.filter(
    (msg) => msg.status === "UNREAD"
  ).length;

  // Calculate notification count for incidents
  const incidentNotificationCount =
    incidentStats.open + incidentStats.investigating;

  useEffect(() => {
    // Only fetch alerts when on alerts tab
    if (activeTab === "alerts") {
      const fetchAlerts = async () => {
        try {
          const [alertsResponse, statsResponse] = await Promise.all([
            alertApi.getAlerts(1, 10), // Get latest 10 alerts for alerts page
            alertApi.getAlertStats(),
          ]);
          setRecentAlerts(alertsResponse.data.alerts);
          setAlertStats(statsResponse.data);
        } catch (error) {
          console.error("Error fetching alerts:", error);
        }
      };

      fetchAlerts();
    }
  }, [activeTab]);

  useEffect(() => {
    // Fetch incidents for dashboard overview
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await incidentApi.getIncidents(1, 100);
      // Handle both IncidentsResponse and direct array responses
      const incidentData: BackendIncident[] = Array.isArray(response.data)
        ? response.data
        : (response.data as IncidentsResponse).incidents;

      setIncidents(incidentData);

      // Calculate stats
      const stats = {
        total: incidentData.length,
        open: incidentData.filter((i: BackendIncident) => i.status === "open")
          .length,
        investigating: incidentData.filter(
          (i: BackendIncident) => i.status === "investigating"
        ).length,
        critical: incidentData.filter(
          (i: BackendIncident) => i.severity === "critical"
        ).length,
      };
      setIncidentStats(stats);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    }
  };

  useEffect(() => {
    // here we fetch the messages received from the users and admins
    const fetchLatestMessages = async () => {
      try {
        const response = await api.get<BackendMessage[]>("/messages");
        setLatestMessages(response.data);
      } catch (error) {
        console.error("Error fetching latest messages:", error);
        toast({
          title: "Error",
          description: "Failed to load latest messages",
          variant: "destructive",
        });
      }
    };

    fetchLatestMessages();
  }, [toast]); // Added toast to dependency array as it's used inside

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

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      // In a real app, you would send this to your backend
      await api.post("/messages", {
        subject: "Prosafe Admin",
        content: newMessage,
        sender_id: user?.id,
      });

      toast({
        title: "Message sent",
        description: "Your message has been sent to the team",
      });
      setNewMessage("");
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      // API call to update profile
      const response = await api.patch("/users/profile", profileData);
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

  const handleNotificationSettingsUpdate = async () => {
    try {
      setLoading(true);
      await api.patch("/users/notification-settings", notificationSettings);
      toast({
        title: "Success",
        description: "Notification settings updated",
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryQuantity = async (id: number, newQuantity: number) => {
    try {
      const response = await inventoryApi.updateItem(id, {
        quantity: newQuantity,
      });
      console.log(response.data);

      // Update local state
      setInventory((prevInventory) =>
        prevInventory.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );

      const updatedItem = inventory.find((item) => item.id === id);
      if (updatedItem) {
        toast({
          title: "Success",
          description: `Quantité de ${updatedItem.name} mise à jour`,
        });

        if (newQuantity < updatedItem.min_stock_level && newQuantity >= 0) {
          toast({
            title: "Warning",
            description: `Stock faible: ${updatedItem.name} (${newQuantity} restants)`,
            variant: "destructive",
          });
        }
      }

      // Refresh inventory stats
      const statsResponse = await inventoryApi.getStats();
      setInventoryStats(statsResponse.data);
    } catch (error) {
      console.error("Error updating inventory quantity:", error);
      toast({
        title: "Error",
        description: "Erreur lors de la mise à jour de la quantité",
        variant: "destructive",
      });
    }
  };

  const refreshInventory = async () => {
    setIsRefreshingInventory(true);
    try {
      await Promise.all([
        fetchInventoryData(),
        (async () => {
          const response = await inventoryApi.getStats();
          setInventoryStats(response.data);
        })(),
      ]);
      toast({
        title: "Success",
        description: "Inventaire mis à jour",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Erreur lors de l'actualisation",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingInventory(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(inventorySearchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tous" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter(
    (item) => item.quantity <= item.min_stock_level
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-500 bg-red-50";
      case "medium":
        return "text-amber-500 bg-amber-50";
      case "low":
        return "text-green-500 bg-green-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unresolved":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "monitoring":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "investigating":
        return "bg-purple-100 text-purple-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "No Date";
    }

    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLocation = (incident: BackendIncident) => {
    // Check for manual address first
    if (incident.location?.manualAddress) {
      return incident.location.manualAddress;
    }

    // Check for coordinates
    if (incident.location?.lat && incident.location?.long) {
      return `${parseFloat(incident.location.lat.toString()).toFixed(4)}, ${parseFloat(incident.location.long.toString()).toFixed(4)}`;
    }

    // Fallback to location object coordinates
    if (incident.location?.lat && incident.location?.long) {
      return `${parseFloat(incident.location.lat.toString()).toFixed(4)}, ${parseFloat(incident.location.long.toString()).toFixed(4)}`;
    }

    return "No Location";
  };

  const formatIncidentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const formatIncidentSeverity = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
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
  const renderDashboardContent = () => {
    return (
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {t("adminDashboard.total_assets")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">88/100</div>
                <div className="text-sm text-green-500 flex items-center">
                  [] +3% <ChevronDown className="h-4 w-4 rotate-180" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("adminDashboard.total_assets_description")}
                {/* Security score is a measure of how secure your system is */}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {t("adminDashboard.total_incidents")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">3</div>
                <div className="text-sm text-red-500 flex items-center">
                  +1 <ChevronDown className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                [] 2 critical, 1 moderate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {t("adminDashboard.total_devices")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">127</div>
                <div className="text-sm text-green-500 flex items-center">
                  +5 <ChevronDown className="h-4 w-4 rotate-180" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("adminDashboard.total_devices_description")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {t("adminDashboard.system_status")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  {t("adminDashboard.operational")}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("adminDashboard.all_systems_running_properly")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Stats Cards */}
        {inventoryStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminDashboard.total_items")}
                </CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventoryStats.totalItems}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminDashboard.low_stock")}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {inventoryStats.lowStockItems}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminDashboard.out_of_stock")}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {inventoryStats.outOfStockItems}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("adminDashboard.total_value")}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${inventoryStats.totalValue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="threats">Threats</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="audits">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Security Score Trend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Security Score Trend</CardTitle>
                  <CardDescription>
                    Your security posture over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={securityScoreData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[50, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#0565d3"
                          strokeWidth={3}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Incident Trends</CardTitle>
                  <CardDescription>
                    Number of incidents reported by month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getIncidentsByMonth(incidents)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="incidents"
                          fill="#0565d3"
                          name="Incidents"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Incidents */}

              {/* Threat Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Threat Distribution</CardTitle>
                  <CardDescription>By category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={threatData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label
                        >
                          {threatData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={THREAT_COLORS[index % THREAT_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Incident Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle>User Incidents</CardTitle>
                  <CardDescription>
                    List of incidents reported by the current user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {/* Filter incidents by current user ID */}
                    {incidents &&
                    incidents.filter(
                      (incident) => incident.reporter_name === user?.id
                    ).length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2">Description</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Map through filtered incidents and display each one */}
                          {incidents
                            .filter(
                              (incident) =>
                                incident?.reporter.firstName === user?.id
                            )
                            .map((incident, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2">
                                  {incident.description}
                                </td>
                                <td className="px-4 py-2">{incident.status}</td>
                                <td className="px-4 py-2">
                                  {formatDate(incident.created_at)}
                                </td>
                                <td className="px-4 py-2">{incident.type}</td>
                                <td className="px-4 py-2">
                                  {incident.severity}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-gray-500 text-center py-4">
                        No incidents reported by you yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>System Activity</CardTitle>
                  <CardDescription>
                    Recent system events and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start p-4 border rounded-lg">
                      <Activity className="h-5 w-5 text-blue-500 mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold">
                          System Backup Completed
                        </h4>
                        <p className="text-sm text-gray-600">
                          Daily backup process finished successfully
                        </p>
                        <span className="text-xs text-gray-500">
                          2 hours ago[]
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start p-4 border rounded-lg">
                      <Shield className="h-5 w-5 text-green-500 mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold">
                          Security Scan Complete
                        </h4>
                        <p className="text-sm text-gray-600">
                          No threats detected in latest scan
                        </p>
                        <span className="text-xs text-gray-500">
                          4 hours ago[]
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start p-4 border rounded-lg">
                      <Users className="h-5 w-5 text-amber-500 mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold">New User Registration</h4>
                        <p className="text-sm text-gray-600">
                          3 []new users pending approval
                        </p>
                        <span className="text-xs text-gray-500">
                          6 hours ago[]
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Placeholder for other tabs */}
          <TabsContent value="threats">
            <Card>
              <CardHeader>
                <CardTitle>Threat Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed threat analysis content will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Compliance reporting and status will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audits">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p>System and user activity logs will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </>
    );
  };
  const getTabTitle = () => {
    switch (activeTab) {
      case "overview":
        return "Security Dashboard";
      case "users":
        return "User Management";
      case "incidents":
        return "Incident Logs";
      case "profile":
        return "My Profile";
      case "user-settings":
        return "User Settings";
      case "messages":
        return "Messages";
      case "inventory":
        return "Inventory Management";
      case "training":
        return "Training Management";
      case "notifications":
        return "Notification Settings";
      case "admin-notifications":
        return "Send Notifications";
      default:
        return "Security Dashboard";
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
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("incidents")}
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
            onClick={() => setActiveTab("users")}
          >
            <Users className="mr-2 h-5 w-5" />
            Users
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("messages")}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Messages
            {unreadMessageCount > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {unreadMessageCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("inventory")}
          >
            <Box className="mr-2 h-5 w-5" />
            Inventory
            {lowStockItems.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {lowStockItems.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("training")}
          >
            <GraduationCap className="mr-2 h-5 w-5" />
            Training Management
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("notifications")}
          >
            <Bell className="mr-2 h-5 w-5" />
            Notification Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("admin-notifications")}
          >
            <Send className="mr-2 h-5 w-5" />
            Send Notifications
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={() => setActiveTab("profile")}
          >
            <User className="mr-2 h-5 w-5" />
            My Profile
          </Button>

          <div className="pt-6 mt-6 border-t border-gray-100">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
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
              Go to Home
            </Link>

            {/* Notifications with incident count */}
            <div className="relative">
              <Button variant="outline" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              {incidentNotificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {incidentNotificationCount}
                </span>
              )}
            </div>

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
                        My Profile
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
                                <Badge variant="outline">Standard</Badge>
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

                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openChangeRoleDialog(user)}
                                  title="Change Role"
                                  className="h-8 w-8"
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>

                                {!user.roles.includes("admin") && (
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

                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteUser(user.email)}
                                  title="Delete User"
                                  className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
          ) : activeTab === "incidents" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Incident Management
                </h2>
                <p className="text-muted-foreground">
                  View and manage all security incidents reported by users.
                </p>
              </div>

              {/* Incident Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Incidents
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {incidentStats.total}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {incidentStats.open}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Investigating
                    </CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {incidentStats.investigating}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Critical
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {incidentStats.critical}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Incidents</CardTitle>
                    <CardDescription>
                      Complete list of incidents reported by users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {incidents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No incidents reported yet.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incidents.map((incident) => (
                            <TableRow key={incident.id}>
                              <TableCell className="font-medium">
                                #{incident.id}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {incident.description}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {formatIncidentType(incident.type)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  style={{
                                    backgroundColor:
                                      INCIDENT_COLORS[incident.severity],
                                    color: "white",
                                    borderColor:
                                      INCIDENT_COLORS[incident.severity],
                                  }}
                                >
                                  {formatIncidentSeverity(incident.severity)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getIncidentStatusColor(
                                    incident.status
                                  )}
                                >
                                  {incident.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {incident.reporter?.firstName}{" "}
                                {incident.reporter?.lastName}
                                <div className="text-xs text-muted-foreground">
                                  {incident.reporter_email || "No email"}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {formatLocation(incident)}
                              </TableCell>
                              <TableCell>
                                {formatDate(incident.created_at)}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {incident.photo_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        window.open(
                                          incident.photo_url,
                                          "_blank"
                                        )
                                      }
                                    >
                                      View Photo
                                    </Button>
                                  )}
                                  <Select
                                    value={incident.status}
                                    onValueChange={async (newStatus) => {
                                      try {
                                        await incidentApi.updateIncident(
                                          incident.incidentId,
                                          { status: newStatus }
                                        );
                                        fetchIncidents();
                                        toast({
                                          title: "Success",
                                          description:
                                            "Incident status updated successfully",
                                        });
                                      } catch (error) {
                                        console.error(
                                          "Error updating incident status:",
                                          error
                                        );
                                        toast({
                                          title: "Error",
                                          description:
                                            "Failed to update incident status",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="investigating">
                                        Investigating
                                      </SelectItem>
                                      <SelectItem value="resolved">
                                        Resolved
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
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
            </div>
          ) : activeTab === "messages" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Team Messages
                </h2>
                <p className="text-muted-foreground">
                  Communicate with your security team
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Messages</CardTitle>
                    <CardDescription>
                      Latest communications received.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {latestMessages.length > 0 ? (
                      <ul className="space-y-3">
                        {latestMessages.map((msg) => (
                          <li
                            key={msg.id}
                            className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md"
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>
                                {msg.system_sender ? (
                                  msg.system_sender.charAt(0).toUpperCase()
                                ) : msg.sender ? (
                                  <>
                                    {msg.sender.firstName?.[0]?.toUpperCase() ||
                                      msg.sender.email[0]?.toUpperCase()}
                                    {msg.sender.lastName?.[0]?.toUpperCase()}
                                  </>
                                ) : (
                                  "?"
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-none">
                                {msg.system_sender ||
                                  (msg.sender
                                    ? `${msg.sender.firstName || msg.sender.email.split("@")[0]} ${msg.sender.lastName || ""}`.trim()
                                    : "Unknown Sender")}
                              </p>
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {msg.content}
                              </p>
                            </div>
                            <time className="text-xs text-muted-foreground">
                              {(() => {
                                if (!msg.created_at) return "Invalid Date";
                                const date = new Date(msg.created_at);
                                if (isNaN(date.getTime()))
                                  return "Invalid Date";
                                return date.toLocaleTimeString([], {
                                  year: "2-digit",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              })()}
                            </time>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No recent messages.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Send Message</CardTitle>
                    <CardDescription>
                      Send a message to your team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Input
                          placeholder="Type your message here..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") handleSendMessage();
                          }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={handleSendMessage}>Send</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : activeTab === "inventory" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Inventory Management
                </h2>
                <p className="text-muted-foreground">
                  Suivi et gestion de vos équipements de sécurité
                </p>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={refreshInventory}
                    disabled={isRefreshingInventory}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isRefreshingInventory ? "animate-spin" : ""}`}
                    />
                    Actualiser
                  </Button>
                  <Button
                    className="bg-prosafe-600 hover:bg-prosafe-700"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ajouter un équipement
                  </Button>
                  <Dialog
                    open={isAddModalOpen}
                    onOpenChange={setIsAddModalOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter un équipement</DialogTitle>
                        <DialogDescription>
                          Remplissez les informations de l'équipement à ajouter.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Label htmlFor="nom">
                          Nom
                          <Input
                            id="nom"
                            placeholder="Nom"
                            value={newItem.name}
                            onChange={(e) =>
                              setNewItem({ ...newItem, name: e.target.value })
                            }
                          />
                        </Label>
                        <Label htmlFor="description">
                          Description
                          <Input
                            id="description"
                            placeholder="Description"
                            value={newItem.description}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                description: e.target.value,
                              })
                            }
                          />
                        </Label>
                        <Label htmlFor="sku">
                          SKU
                          <Input
                            id="sku"
                            placeholder="SKU"
                            value={newItem.sku}
                            onChange={(e) =>
                              setNewItem({ ...newItem, sku: e.target.value })
                            }
                          />
                        </Label>
                        <Label htmlFor="prix">
                          Prix (DZD)
                          <Input
                            id="prix"
                            type="number"
                            step="5"
                            placeholder="Prix en DZD"
                            value={newItem.price}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                price: Number(e.target.value),
                              })
                            }
                          />
                        </Label>

                        <Label htmlFor="quantite">
                          Quantité
                          <Input
                            id="quantite"
                            type="number"
                            placeholder="Quantité"
                            value={newItem.quantity}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                quantity: Number(e.target.value),
                              })
                            }
                          />
                        </Label>

                        <Label htmlFor="seuil-stock">
                          Seuil de stock minimum
                          <Input
                            id="seuil-stock"
                            type="number"
                            placeholder="Seuil de stock minimum"
                            value={newItem.min_stock_level}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                min_stock_level: Number(e.target.value),
                              })
                            }
                          />
                        </Label>
                        <Label htmlFor="category">
                          Category
                          <select
                            id="category"
                            value={newItem.category}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                category: e.target.value as InventoryCategory,
                              })
                            }
                            className="w-full border rounded p-2"
                          >
                            {Object.values(InventoryCategory).map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </Label>
                        <Input
                          placeholder="Fournisseur"
                          value={newItem.supplier}
                          onChange={(e) =>
                            setNewItem({ ...newItem, supplier: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Emplacement"
                          value={newItem.location}
                          onChange={(e) =>
                            setNewItem({ ...newItem, location: e.target.value })
                          }
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddEquipment}>Ajouter</Button>
                        <DialogClose asChild>
                          <Button variant="outline">Annuler</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {lowStockItems.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Alertes de stock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lowStockItems.map((item) => (
                        <div
                          key={`alert-${item.id}`}
                          className="text-sm flex justify-between"
                        >
                          <span>{item.name}</span>
                          <span className="font-medium text-yellow-800">
                            {item.quantity} restants (seuil:{" "}
                            {item.min_stock_level})
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Équipements de sécurité</CardTitle>
                  <CardDescription>
                    Gérez votre inventaire et recevez des alertes lors de
                    ruptures de stock
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un équipement..."
                        className="pl-10"
                        value={inventorySearchTerm}
                        onChange={(e) => setInventorySearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={
                            selectedCategory === category
                              ? "default"
                              : "outline"
                          }
                          className={
                            selectedCategory === category
                              ? "bg-prosafe-600 hover:bg-prosafe-700"
                              : ""
                          }
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {filteredInventory.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      Aucun équipement trouvé
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredInventory.map((item) => (
                        <Card
                          key={item.id}
                          className={`border ${item.quantity <= item.min_stock_level ? "border-yellow-300 bg-yellow-50" : ""}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {item.category}
                                </p>
                              </div>
                              {item.quantity <= item.min_stock_level && (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  Quantité:
                                </span>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      if (item.quantity > 0) {
                                        updateInventoryQuantity(
                                          item.id,
                                          item.quantity - 1
                                        );
                                      }
                                    }}
                                  >
                                    <MinusCircle className="h-4 w-4" />
                                  </Button>

                                  <span className="font-medium min-w-[2rem] text-center">
                                    {item.quantity}
                                  </span>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                      updateInventoryQuantity(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-muted-foreground">
                                Seuil minimum: {item.min_stock_level}
                              </div>

                              {item.quantity <= item.min_stock_level && (
                                <p className="mt-3 text-xs text-yellow-700 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Stock faible, réapprovisionnement nécessaire
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  My Profile
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
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Email Notifications</h4>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications via email
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                emailNotifications: e.target.checked,
                              })
                            }
                            className="h-4 w-4"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Security Alerts</h4>
                            <p className="text-sm text-muted-foreground">
                              Get notified about security events
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            title="Security Alerts"
                            placeholder="Enable security alerts notifications"
                            aria-label="Incident alerts Notifications"
                            checked={notificationSettings.securityAlerts}
                            onChange={(e) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                securityAlerts: e.target.checked,
                              })
                            }
                            className="h-4 w-4"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Incident Updates</h4>
                            <p className="text-sm text-muted-foreground">
                              Notifications about incident status changes
                            </p>
                          </div>
                          <input
                            title="Incident Updates Notifications"
                            placeholder="Enable incident updates notifications"
                            aria-label="Incident Updates Notifications"
                            type="checkbox"
                            checked={notificationSettings.incidentUpdates}
                            onChange={(e) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                incidentUpdates: e.target.checked,
                              })
                            }
                            className="h-4 w-4"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">System Maintenance</h4>
                            <p className="text-sm text-muted-foreground">
                              Notifications about system maintenance
                            </p>
                          </div>
                          <input
                            title="System Maintenance Notifications"
                            placeholder="Enable system maintenance notifications"
                            aria-label="System Maintenance Notifications"
                            type="checkbox"
                            checked={notificationSettings.systemMaintenance}
                            onChange={(e) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                systemMaintenance: e.target.checked,
                              })
                            }
                            className="h-4 w-4"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleNotificationSettingsUpdate}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Notification Settings"}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "user-settings" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  User Settings
                </h2>
                <p className="text-muted-foreground">
                  Configure your personal preferences and application settings.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appearance Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize how the application looks and feels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Theme</label>
                      <Select defaultValue="light">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Language</label>
                      <Select defaultValue="en">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Timezone</label>
                      <Select defaultValue="utc">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc">UTC</SelectItem>
                          <SelectItem value="est">Eastern Time</SelectItem>
                          <SelectItem value="pst">Pacific Time</SelectItem>
                          <SelectItem value="cet">
                            Central European Time
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Data</CardTitle>
                    <CardDescription>
                      Control your privacy and data sharing preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Profile Visibility</h4>
                        <p className="text-sm text-muted-foreground">
                          Make your profile visible to other users
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Activity Tracking</h4>
                        <p className="text-sm text-muted-foreground">
                          Allow tracking of your activity for analytics
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Data Export</h4>
                        <p className="text-sm text-muted-foreground">
                          Download your data
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Export Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : activeTab === "training" ? (
            <div className="space-y-6 ">
              <TrainingManagement />
            </div>
          ) : activeTab === "notifications" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Notification Settings
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
                  Send Notifications
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
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
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
