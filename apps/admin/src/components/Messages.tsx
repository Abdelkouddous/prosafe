import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Archive,
  AlertTriangle,
  Trash2,
  MailCheck,
  Send,
  Plus,
} from "lucide-react";

interface Message {
  id: number;
  subject: string;
  content: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  recipient?: {
    // Added optional recipient
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: "unread" | "read" | "archived";
  created_at: string;
  is_urgent: boolean;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [openComposeDialog, setOpenComposeDialog] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: "",
    content: "",
    is_urgent: false,
    send_to_all: false, // Added send_to_all state
  });

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get("/messages");
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/messages/${id}/read`);
      toast({
        title: "Success",
        description: "Message marked as read",
      });
      fetchMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await api.patch(`/messages/${id}/archive`);
      toast({
        title: "Success",
        description: "Message archived",
      });
      fetchMessages();
    } catch (error) {
      console.error("Error archiving message:", error);
      toast({
        title: "Error",
        description: "Failed to archive message",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/messages/${id}`);
      toast({
        title: "Success",
        description: "Message deleted",
      });
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    try {
      if (!newMessage.subject || !newMessage.content) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Use POST for creating new messages
      await api.post("/messages", {
        ...newMessage,
        sender_id: user?.id,
      });

      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      setOpenComposeDialog(false);
      setNewMessage({
        subject: "",
        content: "",
        is_urgent: false,
        send_to_all: false,
      }); // Reset send_to_all
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">
            View and manage your messages and notifications.
          </p>
        </div>
        {user?.roles.includes("admin") && ( // Only show compose to admin for now, can be adjusted
          <Button onClick={() => setOpenComposeDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Compose
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">Loading messages...</div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground text-center">
              No messages found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={`${message.is_urgent ? "border-l-4 border-l-red-500" : ""} ${message.status === "unread" ? "bg-blue-50" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {message.subject}
                      {message.is_urgent && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      From: {message.sender.firstName} {message.sender.lastName}{" "}
                      ({message.sender.email})
                      <br />
                      {formatDate(message.created_at)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      message.status === "unread"
                        ? "default"
                        : message.status === "read"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {message.status}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="whitespace-pre-wrap">{message.content}</div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-2">
                {message.status === "unread" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(message.id)}
                    title="Mark as read"
                  >
                    <MailCheck className="h-4 w-4 mr-1" /> Mark as read
                  </Button>
                )}
                {message.status !== "archived" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchive(message.id)}
                    title="Archive"
                  >
                    <Archive className="h-4 w-4 mr-1" /> Archive
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(message.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Compose Message Dialog */}
      <Dialog open={openComposeDialog} onOpenChange={setOpenComposeDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Compose New Message</DialogTitle>
            <DialogDescription>
              Create a new message to send to users.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={newMessage.subject}
                onChange={(e) =>
                  setNewMessage({ ...newMessage, subject: e.target.value })
                }
                placeholder="Enter message subject"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message-content">Message</Label>
              <Textarea
                id="message-content"
                placeholder="Enter message content"
                value={newMessage.content}
                onChange={(e) =>
                  setNewMessage({ ...newMessage, content: e.target.value })
                }
                className="min-h-[100px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="urgent-switch"
                checked={newMessage.is_urgent}
                onCheckedChange={(checked) =>
                  setNewMessage({ ...newMessage, is_urgent: checked })
                }
              />
              <Label htmlFor="urgent-switch">Urgent</Label>
            </div>
            {user?.roles.includes("admin") && ( // Only show send to all for admin
              <div className="flex items-center space-x-2">
                <Switch
                  id="send-to-all-switch"
                  checked={newMessage.send_to_all}
                  onCheckedChange={(checked) =>
                    setNewMessage({ ...newMessage, send_to_all: checked })
                  }
                />
                <Label htmlFor="send-to-all-switch">Send to all users</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenComposeDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              <Send className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
