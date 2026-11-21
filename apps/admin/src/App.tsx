import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  ProtectedRoute,
  AdminRoute,
  AuthRedirect,
} from "@/components/ProtectedRoute";

// Page imports - organized alphabetically
import About from "./pages/About";
import Blog from "./pages/Blog";
import Carreers from "./pages/Carreers";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import IncidentReport from "./pages/IncidentReport";
import IncidentsManagement from "./pages/incidents/IncidentsManagement";
import Index from "./pages/Index";
import EquipmentInventory from "./pages/equipment/EquipmentInventory";
import MaintenancePlanning from "./pages/equipment/MaintenancePlanning";
import MaintenanceHistory from "./pages/equipment/MaintenanceHistory";
import TrainingCatalogue from "./pages/trainings/TrainingCatalogue";
import TrainingSessions from "./pages/trainings/TrainingSessions";
import TrainingCompliance from "./pages/trainings/TrainingCompliance";
import Reports from "./pages/reports/Reports";
import CorrectiveActions from "./pages/actions/CorrectiveActions";
import Messaging from "./pages/messages/Messaging";
import Rewards from "./pages/rewards/Rewards";
import Alerts from "./pages/alerts/Alerts";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Profile from "./pages/Profile";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import Terms from "./pages/Terms";

import Updates from "./pages/Updates";

import Services from "./pages/Services";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes - accessible to all users */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />}></Route>
              <Route path="/blog" element={<Blog />} />
              <Route path="/careers" element={<Carreers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/security" element={<Security />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/updates" element={<Updates />} />

              {/* Authentication route - redirects if already logged in */}
              <Route
                path="/login"
                element={
                  <AuthRedirect>
                    <Login />
                  </AuthRedirect>
                }
              />

              {/* Admin-only routes */}
              <Route element={<AdminRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<Navigate to="/equipment" replace />} />
                <Route path="/equipment" element={<EquipmentInventory />} />
                <Route path="/equipment/maintenance" element={<MaintenancePlanning />} />
                <Route path="/equipment/history" element={<MaintenanceHistory />} />
                <Route path="/trainings" element={<TrainingCatalogue />} />
                <Route path="/trainings/sessions" element={<TrainingSessions />} />
                <Route path="/trainings/compliance" element={<TrainingCompliance />} />
                <Route path="/incidents/manage" element={<IncidentsManagement />} />
                <Route path="/corrective-actions" element={<CorrectiveActions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/messages" element={<Messaging />} />
                <Route path="/rewards" element={<Rewards />} />
              </Route>

              {/* Protected routes for authenticated users */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/incidents" element={<IncidentReport />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Catch-all route - MUST be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
