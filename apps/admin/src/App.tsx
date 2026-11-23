import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  ProtectedRoute,
  AdminRoute,
  AuthRedirect,
} from "@/components/ProtectedRoute";

// Page imports - organized alphabetically
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Carreers = lazy(() => import("./pages/Carreers"));
const Contact = lazy(() => import("./pages/Contact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Features = lazy(() => import("./pages/Features"));
const IncidentReport = lazy(() => import("./pages/IncidentReport"));
const IncidentsManagement = lazy(() => import("./pages/incidents/IncidentsManagement"));
import Index from "./pages/Index";
const EquipmentInventory = lazy(() => import("./pages/equipment/EquipmentInventory"));
const MaintenancePlanning = lazy(() => import("./pages/equipment/MaintenancePlanning"));
const MaintenanceHistory = lazy(() => import("./pages/equipment/MaintenanceHistory"));
const TrainingCatalogue = lazy(() => import("./pages/trainings/TrainingCatalogue"));
const TrainingSessions = lazy(() => import("./pages/trainings/TrainingSessions"));
const TrainingCompliance = lazy(() => import("./pages/trainings/TrainingCompliance"));
const Reports = lazy(() => import("./pages/reports/Reports"));
const CorrectiveActions = lazy(() => import("./pages/actions/CorrectiveActions"));
const Messaging = lazy(() => import("./pages/messages/Messaging"));
const Rewards = lazy(() => import("./pages/rewards/Rewards"));
const Alerts = lazy(() => import("./pages/alerts/Alerts"));
const Risks = lazy(() => import("./pages/risks/Risks"));
const RiskMatrix = lazy(() => import("./pages/risks/RiskMatrix"));
const ActionPlans = lazy(() => import("./pages/risks/ActionPlans"));
const Lmra = lazy(() => import("./pages/risks/Lmra"));
const Audits = lazy(() => import("./pages/audits/Audits"));
const AuditExecution = lazy(() => import("./pages/audits/AuditExecution"));
const ComplianceDocuments = lazy(() => import("./pages/audits/ComplianceDocuments"));
const Emergency = lazy(() => import("./pages/emergency/Emergency"));
const Feedback = lazy(() => import("./pages/feedback/Feedback"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Profile = lazy(() => import("./pages/Profile"));
const Security = lazy(() => import("./pages/Security"));
const Settings = lazy(() => import("./pages/Settings"));
const Terms = lazy(() => import("./pages/Terms"));

const Updates = lazy(() => import("./pages/Updates"));

const Services = lazy(() => import("./pages/Services"));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-prosafe-600" />
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
              <Route path="/forgot-password" element={<ForgotPassword />} />

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
                <Route path="/risks" element={<Risks />} />
                <Route path="/risks/matrix" element={<RiskMatrix />} />
                <Route path="/risks/action-plans" element={<ActionPlans />} />
                <Route path="/risks/lmra" element={<Lmra />} />
                <Route path="/audits" element={<Audits />} />
                <Route path="/audits/:id" element={<AuditExecution />} />
                <Route path="/compliance" element={<ComplianceDocuments />} />
                <Route path="/emergency" element={<Emergency />} />
                <Route path="/feedback" element={<Feedback />} />
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
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
