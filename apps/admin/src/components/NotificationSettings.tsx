import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Settings,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import {
  notificationService,
  NotificationSettings as INotificationSettings,
  TrainingNotification,
} from "@/services/notificationService";

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<INotificationSettings>({
    trainingReminderDays: 7,
    enableEmailNotifications: true,
    enableInAppNotifications: true,
  });
  const [notifications, setNotifications] = useState<TrainingNotification[]>(
    []
  );
  const [stats, setStats] = useState({
    totalPending: 0,
    dueSoon: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentSettings = notificationService.getSettings();
      const pendingNotifications =
        await notificationService.getTrainingNotifications();
      const notificationStats =
        await notificationService.getNotificationStats();

      setSettings(currentSettings);
      setNotifications(pendingNotifications);
      setStats(notificationStats);
    } catch (error) {
      console.error("Failed to load notification data:", error);
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = (
    newSettings: Partial<INotificationSettings>
  ) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    notificationService.updateSettings(updatedSettings);
    toast.success("Notification settings updated");

    // Reload notifications with new settings
    loadData();
  };

  const handleTestNotifications = async () => {
    try {
      await notificationService.processNotifications();
      toast.success("Test notifications sent successfully");
    } catch (error) {
      console.error("Failed to send test notifications:", error);
      toast.error("Failed to send test notifications");
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    if (type === "reminder") {
      return <Badge className="bg-yellow-100 text-yellow-800">Reminder</Badge>;
    } else if (type === "overdue") {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    }
    return <Badge variant="outline">{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const createNotification = (notification: TrainingNotification) => {
    setNotifications([...notifications, notification]);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.dueSoon}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and when training notifications are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Send training reminders via email
                </div>
              </div>
              <Switch
                checked={settings.enableEmailNotifications}
                onCheckedChange={(checked) =>
                  handleSettingsUpdate({ enableEmailNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">In-App Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Show training reminders in the dashboard
                </div>
              </div>
              <Switch
                checked={settings.enableInAppNotifications}
                onCheckedChange={(checked) =>
                  handleSettingsUpdate({ enableInAppNotifications: checked })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reminderDays">
                Reminder Days Before Due Date
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="reminderDays"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.trainingReminderDays}
                  onChange={(e) =>
                    handleSettingsUpdate({
                      trainingReminderDays: parseInt(e.target.value) || 7,
                    })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Send notifications this many days before training is due
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTestNotifications} variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Test Notifications
            </Button>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Notifications</CardTitle>
          <CardDescription>
            Training notifications that will be sent based on current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Training</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Until Due</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">
                      {notification.trainingTitle}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{notification.assignedUserName}</div>
                        <div className="text-sm text-muted-foreground">
                          {notification.assignedUserEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(notification.dueDate, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {notification.daysUntilDue < 0 ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        {notification.daysUntilDue < 0
                          ? `${Math.abs(notification.daysUntilDue)} days overdue`
                          : notification.daysUntilDue === 0
                            ? "Due today"
                            : `${notification.daysUntilDue} days`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getNotificationTypeBadge(notification.type)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={notification.message}>
                        {notification.message}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <div className="text-lg font-medium">
                No pending notifications
              </div>
              <div className="text-sm">All trainings are up to date!</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
