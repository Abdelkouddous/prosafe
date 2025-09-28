import React, { useState, useEffect } from "react";
import { format, differenceInDays, addDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import Navbar from "@/components/Navbar";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  GraduationCap,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Bell,
  MapPin,
  Users,
  RefreshCw,
} from "lucide-react";
import { adminApi, AdminTask, AdminUser } from "@/services/adminApi";

interface TrainingFormData {
  title: string;
  description: string;
  dueDate: string;
  startDate: string;
  location: string;
  maxParticipants: number;
  priority: "low" | "medium" | "high";
}

const calculateStatus = (training: AdminTask) => {
  if (training.completed) {
    return "completed";
  }

  if (!training.dueDate) {
    return "pending";
  }

  const dueDate = new Date(training.dueDate);
  const now = new Date();
  const daysUntilDue = differenceInDays(dueDate, now);

  if (isPast(dueDate)) {
    return "expired";
  } else if (daysUntilDue <= 7) {
    return "expiring";
  } else {
    return "pending";
  }
};

const TrainingManagement: React.FC = () => {
  const [trainings, setTrainings] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<AdminTask | null>(
    null
  );
  const [formData, setFormData] = useState<TrainingFormData>({
    title: "",
    description: "",
    dueDate: "",
    startDate: "",
    location: "",
    maxParticipants: 50,
    priority: "low",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTasks();
      setTrainings(data.data);
    } catch (error) {
      console.error("Error loading trainings:", error);
      toast.error("Failed to load training data");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await loadData();
      toast.success("Données actualisées");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch =
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;

    const status = calculateStatus(training);
    return matchesSearch && status === filter;
  });

  const trainingCounts = {
    all: trainings.length,
    pending: trainings.filter((t) => calculateStatus(t) === "pending").length,
    expiring: trainings.filter((t) => calculateStatus(t) === "expiring").length,
    completed: trainings.filter((t) => calculateStatus(t) === "completed")
      .length,
    expired: trainings.filter((t) => calculateStatus(t) === "expired").length,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        startDate: formData.startDate,
        location: formData.location,
        maxParticipants: formData.maxParticipants,
        priority: formData.priority,
        // type: "training" as const,
      };

      if (editingTraining) {
        await adminApi.updateTask(editingTraining.id, taskData);
        toast.success("Training updated successfully");
      } else {
        await adminApi.createTask(taskData);
        toast.success("Training created successfully");
      }

      await loadData();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving training:", error);
      toast.error("Failed to save training");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (training: AdminTask) => {
    setEditingTraining(training);
    setFormData({
      title: training.title,
      description: training.description,
      dueDate: training.dueDate || "",
      startDate: training.startDate || "",
      location: training.location || "",
      maxParticipants: training.maxParticipants || 50,
      priority: (training.priority as "low" | "medium" | "high") || "medium",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this training?")) return;

    try {
      await adminApi.deleteTask(id);
      toast.success("Training deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Error deleting training:", error);
      toast.error("Failed to delete training");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      startDate: "",
      location: "",
      maxParticipants: 50,
      priority: "medium",
    });
    setEditingTraining(null);
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    if (!priority || typeof priority !== "string") {
      return "default";
    }

    switch (priority.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
      return format(date, "PPP à HH:mm", { locale: fr });
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return "Date invalide";
    }
  };

  const getStatusBadge = (training: AdminTask) => {
    const status = calculateStatus(training);

    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terminé
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
      case "expiring":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Expire bientôt
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expiré
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Inconnu
          </span>
        );
    }
  };

  const handleCompleteTraining = async (trainingId: number) => {
    try {
      await adminApi.completeTask(trainingId);
      await refreshData();
      toast.success("Formation marquée comme terminée");
    } catch (error) {
      console.error("Error completing training:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const sendReminders = async () => {
    try {
      const expiringTrainings = trainings?.filter(
        (t) => calculateStatus(t) === "expiring"
      );

      if (expiringTrainings.length === 0) {
        toast.info("Aucune formation n'expire bientôt");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(
        `Rappels programmés pour ${expiringTrainings.length} formation(s)`
      );
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Erreur lors de l'envoi des rappels");
    }
  };

  return (
    <div className="min-h-screen ">
      <h1 className="text-2xl font-bold text-prosafe-700 flex items-center gap-2">
        <GraduationCap className="h-6 w-6" />
        Training Management
      </h1>
      <p className="text-muted-foreground">
        Manage training programs and track user progress.
      </p>
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-prosafe-600 hover:bg-prosafe-700"
                  onClick={() => resetForm()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Annoncer une Formation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTraining
                      ? "Modifier la Formation"
                      : "Créer une Formation"}
                  </DialogTitle>
                  <DialogDescription>
                    Créer une nouvelle annonce de formation visible par tous les
                    employés.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Titre de la formation"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priorité</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: "low" | "medium" | "high") =>
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Description détaillée de la formation"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxParticipants">Max Participants</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxParticipants: parseInt(e.target.value) || 0,
                          })
                        }
                        min="1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Lieu</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="Lieu de la formation"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Date de début</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Date limite d'inscription</Label>
                      <Input
                        id="dueDate"
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Annuler
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading
                        ? "Création..."
                        : editingTraining
                          ? "Mettre à jour"
                          : "Créer la Formation"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-prosafe-700">
                {trainingCounts.all}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {trainingCounts.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expire bientôt
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {trainingCounts.expiring}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {trainingCounts.completed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirées</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {trainingCounts.expired}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des formations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="expiring">Expire bientôt</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="expired">Expirées</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={sendReminders}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Envoyer rappels
            </Button>
          </div>
        </div>

        {/* Training List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-prosafe-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">
                Chargement des formations...
              </p>
            </div>
          </div>
        ) : filteredTrainings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune formation trouvée
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || filter !== "all"
                  ? "Aucune formation ne correspond à vos critères de recherche."
                  : "Commencez par créer votre première annonce de formation."}
              </p>
              {!searchTerm && filter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Annoncer une Formation
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrainings.map((training) => (
              <Card
                key={training.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {training.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(training)}
                        <Badge variant={getPriorityColor(training.priority)}>
                          {training.priority || "Unknown"} Priority
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {calculateStatus(training) === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompleteTraining(training.id)}
                          title="Marquer comme terminé"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(training)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(training.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {training.description}
                  </p>

                  <div className="space-y-2">
                    {training.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Début: {formatDate(training.startDate)}</span>
                      </div>
                    )}

                    {training.dueDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Inscription avant: {formatDate(training.dueDate)}
                        </span>
                      </div>
                    )}

                    {training.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{training.location}</span>
                      </div>
                    )}

                    {training.maxParticipants && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {training.currentParticipants || 0} /{" "}
                          {training.maxParticipants} participants
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Créé: {formatDate(training.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingManagement;
