
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import BusinessDashboard from "./pages/dashboards/BusinessDashboard";
import RecruiterDashboard from "./pages/dashboards/RecruiterDashboard";
import JobSeekerDashboard from "./pages/dashboards/JobSeekerDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import SweaquityDashboard from "./pages/dashboards/SweaquityDashboard";
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage";
import ProjectApplicationPage from "./pages/projects/ProjectApplicationPage";
import ProfileCompletePage from "./pages/ProfileCompletePage";
import { BetaTestingButton } from "./components/shared/BetaTestingButton";

const queryClient = new QueryClient();

// Redirect component to handle project redirect with proper typing
const ProjectRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/projects/${id}`} replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="app-container">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/:type" element={<AuthPage />} />
              <Route path="/business/dashboard" element={<BusinessDashboard />} />
              <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
              <Route path="/seeker/dashboard" element={<JobSeekerDashboard />} />
              <Route path="/seeker/profile/complete" element={<ProfileCompletePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/sweaquity" element={<SweaquityDashboard />} />
              <Route path="/projects/:id" element={<ProjectDetailsPage />} />
              <Route path="/projects/:id/apply" element={<ProjectApplicationPage />} />
              <Route path="/project/:id" element={<ProjectRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          {/* Add the BetaTestingButton */}
          <BetaTestingButton />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
