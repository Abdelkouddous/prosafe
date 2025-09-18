import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Loader2,
  MapPin,
  Camera,
  Upload,
  AlertTriangle,
  Home,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/services/api";

// Enums matching backend
enum IncidentType {
  SAFETY = "safety",
  SECURITY = "security",
  HR_VIOLATION = "hr_violation",
}

enum IncidentSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

const formSchema = z.object({
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères",
  }),
  type: z.nativeEnum(IncidentType, {
    message: "Veuillez sélectionner un type d'incident",
  }),
  severity: z.nativeEnum(IncidentSeverity, {
    message: "Veuillez sélectionner une gravité",
  }),
  location: z.object({
    lat: z.number().min(-90).max(90).optional(),
    long: z.number().min(-180).max(180).optional(),
    manualAddress: z.string().optional(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Local storage keys
const DEFAULT_ADDRESS_KEY = "prosafe_default_address";
const USER_ADDRESSES_KEY = "prosafe_user_addresses";

interface SavedAddress {
  address: string;
  lat?: number;
  lng?: number;
  timestamp: number;
}

const IncidentReport = () => {
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [files, setFiles] = useState<File[]>([]);
  const [manualAddress, setManualAddress] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [defaultAddress, setDefaultAddress] = useState<SavedAddress | null>(
    null
  );
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      type: undefined,
      severity: undefined,
      location: {
        lat: undefined,
        long: undefined,
        manualAddress: "",
      },
    },
  });

  // Load saved addresses on component mount
  useEffect(() => {
    const savedDefault = localStorage.getItem(DEFAULT_ADDRESS_KEY);
    const savedAddressList = localStorage.getItem(USER_ADDRESSES_KEY);

    if (savedDefault) {
      try {
        const defaultAddr = JSON.parse(savedDefault);
        setDefaultAddress(defaultAddr);
        setManualAddress(defaultAddr.address);
        form.setValue("location.manualAddress", defaultAddr.address);
        if (defaultAddr.lat && defaultAddr.lng) {
          setLocation({ lat: defaultAddr.lat, lng: defaultAddr.lng });
          form.setValue("location.lat", defaultAddr.lat);
          form.setValue("location.long", defaultAddr.lng);
        }
      } catch (error) {
        console.error("Error loading default address:", error);
      }
    }

    if (savedAddressList) {
      try {
        const addresses = JSON.parse(savedAddressList);
        setSavedAddresses(addresses);
      } catch (error) {
        console.error("Error loading saved addresses:", error);
      }
    }
  }, [form]);

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      setIsResolvingAddress(true);
      // Using OpenStreetMap Nominatim API (free alternative to Google Maps)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error("Geocoding service unavailable");
      }

      const data = await response.json();
      return data.display_name || `${lat}, ${lng}`;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `${lat}, ${lng}`;
    } finally {
      setIsResolvingAddress(false);
    }
  };

  // Save address to local storage
  const saveAddress = (address: string, lat?: number, lng?: number) => {
    const newAddress: SavedAddress = {
      address,
      lat,
      lng,
      timestamp: Date.now(),
    };

    // Save as default if it's the first address
    if (!defaultAddress) {
      localStorage.setItem(DEFAULT_ADDRESS_KEY, JSON.stringify(newAddress));
      setDefaultAddress(newAddress);
      toast.success("Adresse sauvegardée comme adresse par défaut");
    }

    // Add to saved addresses list (avoid duplicates)
    const updatedAddresses = savedAddresses.filter(
      (addr) => addr.address !== address
    );
    updatedAddresses.unshift(newAddress);

    // Keep only last 5 addresses
    const limitedAddresses = updatedAddresses.slice(0, 5);

    localStorage.setItem(USER_ADDRESSES_KEY, JSON.stringify(limitedAddresses));
    setSavedAddresses(limitedAddresses);
  };

  const getGeolocation = async () => {
    if (navigator.geolocation) {
      setIsGeolocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Validate coordinates
          if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            console.error("Invalid latitude:", latitude);
            toast.error("Latitude invalide reçue du GPS");
            setIsGeolocating(false);
            return;
          }

          if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            console.error("Invalid longitude:", longitude);
            toast.error("Longitude invalide reçue du GPS");
            setIsGeolocating(false);
            return;
          }

          setLocation({ lat: latitude, lng: longitude });
          form.setValue("location.lat", latitude);
          form.setValue("location.long", longitude);

          // Automatically resolve address
          const address = await reverseGeocode(latitude, longitude);
          setResolvedAddress(address);

          // If no manual address is set, use the resolved one
          if (!manualAddress.trim()) {
            setManualAddress(address);
            form.setValue("location.manualAddress", address);
            saveAddress(address, latitude, longitude);
          }

          setIsGeolocating(false);
          toast.success("Localisation et adresse récupérées avec succès");
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setIsGeolocating(false);
          toast.error("Impossible de récupérer la localisation");
        }
      );
    } else {
      toast.error(
        "La géolocalisation n'est pas prise en charge par votre navigateur"
      );
    }
  };

  const useDefaultAddress = () => {
    if (defaultAddress) {
      setManualAddress(defaultAddress.address);
      form.setValue("location.manualAddress", defaultAddress.address);

      if (defaultAddress.lat && defaultAddress.lng) {
        setLocation({ lat: defaultAddress.lat, lng: defaultAddress.lng });
        form.setValue("location.lat", defaultAddress.lat);
        form.setValue("location.long", defaultAddress.lng);
      }

      toast.success("Adresse par défaut appliquée");
    }
  };

  const useSavedAddress = (savedAddr: SavedAddress) => {
    setManualAddress(savedAddr.address);
    form.setValue("location.manualAddress", savedAddr.address);

    if (savedAddr.lat && savedAddr.lng) {
      setLocation({ lat: savedAddr.lat, lng: savedAddr.lng });
      form.setValue("location.lat", savedAddr.lat);
      form.setValue("location.long", savedAddr.lng);
    }

    setShowAddressSuggestions(false);
    toast.success("Adresse sélectionnée");
  };

  const handleManualAddressChange = (value: string) => {
    setManualAddress(value);
    form.setValue("location.manualAddress", value);

    // Save address when user finishes typing (after 2 seconds of no changes)
    if (value.trim().length > 5) {
      const timeoutId = setTimeout(() => {
        saveAddress(value, location?.lat, location?.lng);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Add incident data
      formData.append("description", data.description);
      formData.append("type", data.type);
      formData.append("severity", data.severity);

      // Add location fields individually instead of as JSON string
      // Validate coordinates before sending
      if (data.location.lat !== undefined) {
        if (
          isNaN(data.location.lat) ||
          data.location.lat < -90 ||
          data.location.lat > 90
        ) {
          toast.error("Latitude invalide. Doit être entre -90 et 90.");
          return;
        }
        formData.append("location[lat]", data.location.lat.toString());
      }

      if (data.location.long !== undefined) {
        if (
          isNaN(data.location.long) ||
          data.location.long < -180 ||
          data.location.long > 180
        ) {
          toast.error("Longitude invalide. Doit être entre -180 et 180.");
          return;
        }
        formData.append("location[long]", data.location.long.toString());
      }
      if (manualAddress || data.location.manualAddress) {
        formData.append(
          "location[manualAddress]",
          manualAddress || data.location.manualAddress || ""
        );
      }

      // Add photo if available (backend expects single photo)
      if (files.length > 0) {
        formData.append("photo", files[0]);
      }

      // Send to backend
      const response = await api.post("/incidents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        `Incident signalé avec succès! ID: ${response.data.incidentId}`
      );

      // Reset form but keep default address
      form.reset();
      setFiles([]);
      setResolvedAddress("");

      // Restore default address
      if (defaultAddress) {
        setManualAddress(defaultAddress.address);
        form.setValue("location.manualAddress", defaultAddress.address);
        if (defaultAddress.lat && defaultAddress.lng) {
          setLocation({ lat: defaultAddress.lat, lng: defaultAddress.lng });
          form.setValue("location.lat", defaultAddress.lat);
          form.setValue("location.long", defaultAddress.lng);
        }
      } else {
        setLocation(null);
        setManualAddress("");
      }
    } catch (error) {
      console.error("Error submitting incident:", error);

      if (error.response?.data?.message) {
        toast.error(`Erreur: ${error.response.data.message}`);
      } else {
        toast.error("Erreur lors de la soumission de l'incident");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-prosafe-700">
              <AlertTriangle className="h-6 w-6" />
              Déclaration d'Incident
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description détaillée *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez en détail ce qui s'est passé..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'incident *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez le type d'incident" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={IncidentType.SAFETY}>
                            Sécurité
                          </SelectItem>
                          <SelectItem value={IncidentType.SECURITY}>
                            Sûreté
                          </SelectItem>
                          <SelectItem value={IncidentType.HR_VIOLATION}>
                            Violation RH
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gravité *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez la gravité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={IncidentSeverity.LOW}>
                            Faible
                          </SelectItem>
                          <SelectItem value={IncidentSeverity.MEDIUM}>
                            Moyenne
                          </SelectItem>
                          <SelectItem value={IncidentSeverity.HIGH}>
                            Élevée
                          </SelectItem>
                          <SelectItem value={IncidentSeverity.CRITICAL}>
                            Critique
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>Localisation</FormLabel>

                  {/* Address Input with Suggestions */}
                  <div className="relative">
                    <Input
                      placeholder="Adresse de l'incident"
                      value={manualAddress}
                      onChange={(e) =>
                        handleManualAddressChange(e.target.value)
                      }
                      onFocus={() => setShowAddressSuggestions(true)}
                      className="pr-10"
                    />

                    {/* Default Address Indicator */}
                    {defaultAddress &&
                      manualAddress === defaultAddress.address && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Home className="h-4 w-4 text-green-600" />
                          {/* title="Adresse par défaut" /> */}
                        </div>
                      )}

                    {/* Address Suggestions Dropdown */}
                    {showAddressSuggestions &&
                      (savedAddresses.length > 0 || defaultAddress) && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {defaultAddress && (
                            <button
                              type="button"
                              onClick={useDefaultAddress}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b"
                            >
                              <Home className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="text-sm font-medium">
                                  Adresse par défaut
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {defaultAddress.address}
                                </div>
                              </div>
                            </button>
                          )}

                          {savedAddresses.map((addr, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setManualAddress(addr.address);
                                form.setValue(
                                  "location.manualAddress",
                                  addr.address
                                );

                                if (addr.lat && addr.lng) {
                                  setLocation({ lat: addr.lat, lng: addr.lng });
                                  form.setValue("location.lat", addr.lat);
                                  form.setValue("location.long", addr.lng);
                                }

                                setShowAddressSuggestions(false);
                                toast.success("Adresse sélectionnée");
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                            >
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">
                                  {addr.address}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(
                                    addr.timestamp
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setShowAddressSuggestions(false)}
                            className="w-full px-3 py-2 text-center text-xs text-gray-500 hover:bg-gray-50 border-t"
                          >
                            Fermer
                          </button>
                        </div>
                      )}
                  </div>

                  {/* Geolocation Controls */}
                  <div className="flex gap-2 items-center flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getGeolocation}
                      disabled={isGeolocating || isResolvingAddress}
                      className="flex items-center gap-2"
                    >
                      {isGeolocating || isResolvingAddress ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      {isGeolocating
                        ? "Localisation..."
                        : isResolvingAddress
                          ? "Résolution..."
                          : "Ma position actuelle"}
                    </Button>

                    {location && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Position: {location.lat.toFixed(6)},{" "}
                        {location.lng.toFixed(6)}
                      </span>
                    )}
                  </div>

                  {/* Resolved Address Display */}
                  {resolvedAddress && resolvedAddress !== manualAddress && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm font-medium text-blue-800 mb-1">
                        Adresse détectée:
                      </div>
                      <div className="text-sm text-blue-700">
                        {resolvedAddress}
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setManualAddress(resolvedAddress);
                          form.setValue(
                            "location.manualAddress",
                            resolvedAddress
                          );
                          saveAddress(
                            resolvedAddress,
                            location?.lat,
                            location?.lng
                          );
                        }}
                        className="p-0 h-auto text-blue-600 hover:text-blue-800"
                      >
                        Utiliser cette adresse
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <FormLabel>Photo (optionnel)</FormLabel>
                  <div className="mt-1 border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-500">
                      Ajoutez une photo de l'incident (une seule photo acceptée)
                    </p>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger une photo
                    </Button>
                  </div>
                </div>

                {files.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Photo sélectionnée
                    </h4>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <span className="text-sm truncate">{files[0].name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(0)}
                        className="h-7 w-7 p-0"
                      >
                        &times;
                      </Button>
                    </div>
                    {files.length > 1 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Note: Seule la première photo sera envoyée
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-prosafe-600 hover:bg-prosafe-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Signaler l'incident"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* User's Recent Incidents Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-prosafe-700">
              <AlertTriangle className="h-5 w-5" />
              Mes Incidents Signalés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserIncidentsTable />
          </CardContent>
        </Card>
      </div>

      {/* Click outside to close suggestions */}
      {showAddressSuggestions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowAddressSuggestions(false)}
        />
      )}
    </div>
  );
};

export default IncidentReport;

// Add these imports at the top with other imports
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Update the UserIncident interface (around line 760)
interface UserIncident {
  id: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: "pending" | "investigating" | "resolved" | "closed";
  manualAddress?: string;  // Direct field, not nested
  geoLatitude?: number;
  geoLongitude?: number;
  createdAt: string;
  updatedAt: string;
}

// Add this component before the main IncidentReport component
const UserIncidentsTable = () => {
  const [userIncidents, setUserIncidents] = useState<UserIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's incidents when component mounts
  useEffect(() => {
    const fetchUserIncidents = async () => {
      try {
        setIsLoading(true);
        // Fetch incidents for the current user
        // This assumes the backend has an endpoint to get user's own incidents
        const response = await api.get("/incidents/my-incidents");
        setUserIncidents(response.data.slice(0, 5)); // Show only last 5 incidents
      } catch (error) {
        console.error("Error fetching user incidents:", error);
        toast.error("Erreur lors du chargement de vos incidents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserIncidents();
  }, []);

  // Function to get severity color for badges
  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.LOW:
        return "bg-green-100 text-green-800";
      case IncidentSeverity.MEDIUM:
        return "bg-yellow-100 text-yellow-800";
      case IncidentSeverity.HIGH:
        return "bg-orange-100 text-orange-800";
      case IncidentSeverity.CRITICAL:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get status color for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "investigating":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to translate incident type to French
  const getIncidentTypeLabel = (type: IncidentType) => {
    switch (type) {
      case IncidentType.SAFETY:
        return "Sécurité";
      case IncidentType.SECURITY:
        return "Sûreté";
      case IncidentType.HR_VIOLATION:
        return "Violation RH";
      default:
        return type;
    }
  };

  // Function to translate severity to French
  const getSeverityLabel = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.LOW:
        return "Faible";
      case IncidentSeverity.MEDIUM:
        return "Moyenne";
      case IncidentSeverity.HIGH:
        return "Élevée";
      case IncidentSeverity.CRITICAL:
        return "Critique";
      default:
        return severity;
    }
  };

  // Function to translate status to French
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "investigating":
        return "En cours d'investigation";
      case "resolved":
        return "Résolu";
      case "closed":
        return "Fermé";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Chargement de vos incidents...</span>
      </div>
    );
  }

  if (userIncidents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Aucun incident signalé pour le moment.</p>
        <p className="text-sm mt-2">
          Vos incidents apparaîtront ici après soumission.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Voici vos 5 derniers incidents signalés à l'administration.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Gravité</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Lieu</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userIncidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell className="max-w-xs">
                <div className="truncate" title={incident.description}>
                  {incident.description}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getIncidentTypeLabel(incident.type)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getSeverityColor(incident.severity)}>
                  {getSeverityLabel(incident.severity)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(incident.status)}>
                  {getStatusLabel(incident.status)}
                </Badge>
              </TableCell>
              // Fix the table cell rendering (around line 945)
              <TableCell className="max-w-xs">
                <div
                  className="truncate"
                  title={incident.manualAddress}
                >
                  {incident.manualAddress || "Non spécifié"}
                </div>
              </TableCell>
              n.
              <TableCell>
                {format(new Date(incident.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: fr,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {userIncidents.length === 5 && (
        <p className="text-xs text-gray-500 text-center">
          Seuls les 5 derniers incidents sont affichés.
        </p>
      )}
    </div>
  );
};
