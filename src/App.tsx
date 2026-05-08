import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PatientIntake from "./pages/PatientIntake";
import SelfAssess from "./pages/SelfAssess";
import FacilityPortal from "./pages/FacilityPortal";
import CHWDashboard from "./pages/CHWDashboard";
import { RoleGuard } from "./components/RoleGuard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <RoleGuard blockRoles={["chw"]} redirectTo="/chw">
                  <Index />
                </RoleGuard>
              }
            />
            <Route path="/auth" element={<Auth />} />
            <Route path="/self-assess" element={<SelfAssess />} />
            <Route path="/intake/:token" element={<PatientIntake />} />
            <Route
              path="/facility"
              element={
                <RoleGuard blockRoles={["chw"]} redirectTo="/chw">
                  <FacilityPortal />
                </RoleGuard>
              }
            />
            <Route
              path="/chw"
              element={
                <RoleGuard allowRoles={["chw", "admin"]}>
                  <CHWDashboard />
                </RoleGuard>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
