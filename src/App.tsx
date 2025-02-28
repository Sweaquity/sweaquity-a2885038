
import { Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { SeekerRegister } from "./pages/Register/Seeker";
import { SeekerLogin } from "./pages/Login/Seeker";
import { BusinessRegister } from "./pages/Register/Business";
import { BusinessLogin } from "./pages/Login/Business";
import { RecruiterRegister } from "./pages/Register/Recruiter";
import { RecruiterLogin } from "./pages/Login/Recruiter";
import JobSeekerDashboard from "./pages/dashboards/JobSeekerDashboard";
import BusinessDashboard from "./pages/dashboards/BusinessDashboard";
import RecruiterDashboard from "./pages/dashboards/RecruiterDashboard";
import { Index } from "./pages/Index";
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage";
import ProjectApplicationPage from "./pages/projects/ProjectApplicationPage";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/seeker" element={<AuthPage />} />
        <Route path="/auth/business" element={<AuthPage />} />
        <Route path="/auth/recruiter" element={<AuthPage />} />
        
        <Route path="/seeker/register" element={<SeekerRegister />} />
        <Route path="/seeker/login" element={<SeekerLogin />} />
        <Route path="/seeker/dashboard" element={<JobSeekerDashboard />} />
        <Route path="/seeker/profile/complete" element={<JobSeekerDashboard />} />
        <Route path="/business/register" element={<BusinessRegister />} />
        <Route path="/business/login" element={<BusinessLogin />} />
        <Route path="/business/dashboard" element={<BusinessDashboard />} />
        <Route path="/recruiter/register" element={<RecruiterRegister />} />
        <Route path="/recruiter/login" element={<RecruiterLogin />} />
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/projects/:projectId/tasks/:taskId/apply" element={<ProjectApplicationPage />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
