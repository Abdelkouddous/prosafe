import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Index from "./pages/Index";
import InventoryManagement from "./pages/InventoryManagement";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Profile from "./pages/Profile";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import Terms from "./pages/Terms";

import Updates from "./pages/Updates";

// Component imports
import Messages from "./components/Messages";
import Services from "./pages/Services";

// Get the API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  useEffect(() => {
    // Function to test backend connection
    const testBackendConnection = async () => {
      if (!API_BASE_URL) {
        console.error("Admin: API_BASE_URL is not defined!");
        return;
      }
      try {
        console.log(
          `Admin: Attempting to connect to backend at ${API_BASE_URL}/health-check`
        );
        const response = await fetch(`${API_BASE_URL}/health-check`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Admin: Backend connection successful!", data); // Log success
      } catch (error) {
        console.error("Admin: Failed to connect to backend:", error); // Log failure
      }
    };

    testBackendConnection();
  }, []); // Run once on component mount
  const queryClient = new QueryClient();
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
                <Route path="/inventory" element={<InventoryManagement />} />
              </Route>

              {/* Protected routes for authenticated users */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/incidents" element={<IncidentReport />} />
                <Route path="/messages" element={<Messages />} />
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
