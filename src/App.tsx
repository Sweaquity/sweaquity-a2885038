
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';
import ProfileCompletePage from './pages/ProfileCompletePage';
import JobSeekerDashboard from './pages/dashboards/JobSeekerDashboard';
import BusinessDashboard from './pages/dashboards/BusinessDashboard';
import RecruiterDashboard from './pages/dashboards/RecruiterDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ProjectDetailsPage from './pages/projects/ProjectDetailsPage';
import ProjectApplicationPage from './pages/projects/ProjectApplicationPage';
import SweaquityDashboard from './pages/dashboards/SweaquityDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      <Route path="/auth/:type" element={<AuthPage />} />
      <Route path="/auth/:type/:action" element={<AuthPage />} />
      
      <Route path="/seeker/register" element={<AuthPage />} />
      <Route path="/seeker/login" element={<AuthPage />} />
      <Route path="/seeker/dashboard" element={<JobSeekerDashboard />} />
      <Route path="/seeker/profile/complete" element={<ProfileCompletePage />} />
      
      <Route path="/business/register" element={<AuthPage />} />
      <Route path="/business/login" element={<AuthPage />} />
      <Route path="/business/dashboard" element={<BusinessDashboard />} />
      
      <Route path="/recruiter/register" element={<AuthPage />} />
      <Route path="/recruiter/login" element={<AuthPage />} />
      <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
      
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/sweaquity" element={<SweaquityDashboard />} />
      
      <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
      <Route path="/projects/:projectId/apply/:taskId" element={<ProjectApplicationPage />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
