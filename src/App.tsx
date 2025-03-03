
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
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage";
import ProjectApplicationPage from "./pages/projects/ProjectApplicationPage";
import ProfileCompletePage from "./pages/ProfileCompletePage";

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
        <div className="min-h-screen bg-background">
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
              <Route path="/projects/:id" element={<ProjectDetailsPage />} />
              <Route path="/projects/:id/apply" element={<ProjectApplicationPage />} />
              {/* Add redirect route to support /project/ links using the ProjectRedirect component */}
              <Route path="/project/:id" element={<ProjectRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
