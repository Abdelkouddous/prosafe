
import { useState } from "react";
import { format, addMonths, isPast, differenceInDays } from "date-fns";
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
import { toast } from "sonner";
import {
  GraduationCap,
  Calendar,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Mock training data
interface Training {
  id: number;
  name: string;
  employeeName: string;
  completionDate: Date;
  expiryDate: Date;
  status: "valid" | "expiring" | "expired";
}

const calculateStatus = (expiryDate: Date): "valid" | "expiring" | "expired" => {
  const today = new Date();
  if (isPast(expiryDate)) {
    return "expired";
  }
  
  const daysUntilExpiry = differenceInDays(expiryDate, today);
  if (daysUntilExpiry <= 30) {
    return "expiring";
  }
  
  return "valid";
};

// Generate mock training data
const generateTrainings = (): Training[] => {
  const today = new Date();
  
  return [
    {
      id: 1,
      name: "Premiers secours",
      employeeName: "Jean Dupont",
      completionDate: new Date(2023, 5, 15),
      expiryDate: addMonths(new Date(2023, 5, 15), 12),
      status: calculateStatus(addMonths(new Date(2023, 5, 15), 12)),
    },
    {
      id: 2,
      name: "Manipulation d'extincteurs",
      employeeName: "Marie Lambert",
      completionDate: new Date(2023, 9, 10),
      expiryDate: addMonths(new Date(2023, 9, 10), 24),
      status: calculateStatus(addMonths(new Date(2023, 9, 10), 24)),
    },
    {
      id: 3,
      name: "Travail en hauteur",
      employeeName: "Philippe Martin",
      completionDate: new Date(2023, 2, 5),
      expiryDate: addMonths(new Date(2023, 2, 5), 12),
      status: calculateStatus(addMonths(new Date(2023, 2, 5), 12)),
    },
    {
      id: 4,
      name: "Gestion des produits dangereux",
      employeeName: "Sophie Renard",
      completionDate: new Date(2023, 11, 20),
      expiryDate: addMonths(new Date(2023, 11, 20), 12),
      status: calculateStatus(addMonths(new Date(2023, 11, 20), 12)),
    },
    {
      id: 5,
      name: "Ergonomie au travail",
      employeeName: "Thomas Bernard",
      completionDate: new Date(2023, 1, 12),
      expiryDate: addMonths(new Date(2023, 1, 12), 12),
      status: calculateStatus(addMonths(new Date(2023, 1, 12), 12)),
    },
    {
      id: 6,
      name: "Procédures d'urgence",
      employeeName: "Julie Moreau",
      completionDate: new Date(2023, 7, 8),
      expiryDate: addMonths(new Date(2023, 7, 8), 6),
      status: calculateStatus(addMonths(new Date(2023, 7, 8), 6)),
    },
  ];
};

const TrainingTracking = () => {
  const [trainings, setTrainings] = useState<Training[]>(generateTrainings);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch =
      training.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.employeeName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "valid") return matchesSearch && training.status === "valid";
    if (filter === "expiring") return matchesSearch && training.status === "expiring";
    if (filter === "expired") return matchesSearch && training.status === "expired";
    return false;
  });

  const trainingCounts = {
    all: trainings.length,
    valid: trainings.filter(t => t.status === "valid").length,
    expiring: trainings.filter(t => t.status === "expiring").length,
    expired: trainings.filter(t => t.status === "expired").length,
  };

  const refreshData = () => {
    setIsRefreshing(true);
    // Simulate refresh operation
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Données de formation mises à jour");
    }, 1000);
  };

  const getStatusBadge = (status: "valid" | "expiring" | "expired") => {
    if (status === "valid") {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
          <CheckCircle className="h-3 w-3" />
          Valide
        </div>
      );
    } else if (status === "expiring") {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
          <Clock className="h-3 w-3" />
          Expire bientôt
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
          <AlertCircle className="h-3 w-3" />
          Expiré
        </div>
      );
    }
  };

  const sendReminders = () => {
    const expiringCount = trainings.filter(t => t.status === "expiring").length;
    toast.success(`${expiringCount} rappel${expiringCount > 1 ? 's' : ''} envoyé${expiringCount > 1 ? 's' : ''}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-prosafe-700 flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              Suivi des Formations
            </h1>
            <p className="text-muted-foreground">
              Gestion et suivi des formations SST des employés
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
            <Button className="bg-prosafe-600 hover:bg-prosafe-700">
              <Calendar className="h-4 w-4 mr-2" />
              Planifier une formation
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={`cursor-pointer ${filter === 'all' ? 'border-prosafe-500 bg-prosafe-50' : ''}`}
                onClick={() => setFilter('all')}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Toutes les formations</p>
                <p className="text-2xl font-bold">{trainingCounts.all}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-prosafe-600" />
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer ${filter === 'valid' ? 'border-green-500 bg-green-50' : ''}`}
                onClick={() => setFilter('valid')}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Formations valides</p>
                <p className="text-2xl font-bold text-green-700">{trainingCounts.valid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer ${filter === 'expiring' ? 'border-yellow-500 bg-yellow-50' : ''}`}
                onClick={() => setFilter('expiring')}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Expirent bientôt</p>
                <p className="text-2xl font-bold text-yellow-700">{trainingCounts.expiring}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer ${filter === 'expired' ? 'border-red-500 bg-red-50' : ''}`}
                onClick={() => setFilter('expired')}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Formations expirées</p>
                <p className="text-2xl font-bold text-red-700">{trainingCounts.expired}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </CardContent>
          </Card>
        </div>

        {trainingCounts.expiring > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>
                  {trainingCounts.expiring} formation{trainingCounts.expiring > 1 ? 's' : ''} 
                  {' '}expire{trainingCounts.expiring > 1 ? 'nt' : ''} bientôt
                </span>
              </div>
              <Button 
                size="sm" 
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={sendReminders}
              >
                Envoyer des rappels
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Formations SST</CardTitle>
            <CardDescription>
              Gérez et suivez les formations de santé et sécurité au travail de vos employés
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une formation ou un employé..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredTrainings.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Aucune formation trouvée
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Formation</th>
                      <th className="text-left py-3 px-4">Employé</th>
                      <th className="text-left py-3 px-4">Date de validation</th>
                      <th className="text-left py-3 px-4">Date d'expiration</th>
                      <th className="text-left py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainings.map((training) => (
                      <tr 
                        key={training.id} 
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium">{training.name}</span>
                        </td>
                        <td className="py-3 px-4">{training.employeeName}</td>
                        <td className="py-3 px-4">
                          {format(training.completionDate, "d MMMM yyyy", { locale: fr })}
                        </td>
                        <td className="py-3 px-4">
                          {format(training.expiryDate, "d MMMM yyyy", { locale: fr })}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(training.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainingTracking;
