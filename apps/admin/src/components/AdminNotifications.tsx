import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Send,
  Bell,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import api from "@/services/api";

interface NotificationMessage {
  id: number;
  subject: string;
  content: string;
  sender: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  created_at: string;
  is_urgent: boolean;
  recipient_count?: number;
}

const AdminNotifications: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<
    NotificationMessage[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  // Fetch sent notifications history
  const fetchSentNotifications = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get("/admin/messages");
      // Filter messages that were sent to all users
      const broadcastMessages = response.data.filter(
        (msg: NotificationMessage) => msg.content || !msg.recipient_count
      );
      setSentNotifications(broadcastMessages);
    } catch (error) {
      console.error("Error fetching sent notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notification history",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSentNotifications();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both subject and content fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const notificationData = {
        subject: subject.trim(),
        content: content.trim(),
        send_to_all: true,
        is_urgent: isUrgent,
      };

      await api.post("/admin/messages", notificationData);

      toast({
        title: "Success",
        description: "Notification sent to all users successfully!",
      });

      // Reset form
      setSubject("");
      setContent("");
      setIsUrgent(false);

      // Refresh notification history
      fetchSentNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Invalid Date";

    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Send Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Notification to All Users
          </CardTitle>
          <CardDescription>
            Send important announcements and notifications to all users in the
            system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter notification subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your notification message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="urgent"
                checked={isUrgent}
                onCheckedChange={setIsUrgent}
              />
              <Label htmlFor="urgent" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Mark as urgent
              </Label>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to All Users
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Sent Notifications History
              </CardTitle>
              <CardDescription>
                View previously sent notifications to all users
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSentNotifications}
              disabled={loadingHistory}
            >
              {loadingHistory ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading notifications...
            </div>
          ) : sentNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications sent yet</p>
              <p className="text-sm">
                Send your first notification to all users above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {notification.subject}
                        </h4>
                        {notification.is_urgent && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(notification.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Sent to all users
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
