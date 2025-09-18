// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  ProtectedRoute,
  AdminRoute,
  UserRoute,
  AuthRedirect,
} from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import IncidentReport from "./pages/IncidentReport";
import InventoryManagement from "./pages/InventoryManagement";
import TrainingTracking from "./pages/TrainingTracking";
import Messages from "./components/Messages";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <AuthProvider>
//         <Toaster />
//         <Sonner />
//         <BrowserRouter>
//           <Routes>
//             {/* Public routes */}
//             <Route path="/" element={<Index />} />
//             <Route path="/login" element={<Login />} />

//             {/* Protected routes */}
//             <Route element={<ProtectedRoute />}>
//               <Route path="/dashboard" element={<Dashboard />} />
//               <Route path="/incidents" element={<IncidentReport />} />
//               <Route path="/training" element={<TrainingTracking />} />
//             </Route>

//             {/* Admin routes */}
//             <Route element={<AdminRoute />}>
//               <Route path="/inventory" element={<InventoryManagement />} />
//             </Route>

//             {/* Catch-all route */}
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </BrowserRouter>
//       </AuthProvider>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;
// apps/admin/src/App.tsx
import { useEffect } from "react"; // Import useEffect

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
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />

              {/* Admin-only routes */}
              <Route element={<AdminRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<InventoryManagement />} />
              </Route>

              {/* Protected routes for authenticated users */}
              <Route element={<ProtectedRoute />}>
                <Route path="/incidents" element={<IncidentReport />} />
                <Route path="/training" element={<TrainingTracking />} />
                <Route path="/messages" element={<Messages />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
