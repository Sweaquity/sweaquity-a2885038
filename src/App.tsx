import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import SeekerLogin from './pages/auth/SeekerLogin';
import BusinessLogin from './pages/auth/BusinessLogin';
import RecruiterLogin from './pages/auth/RecruiterLogin';
import SeekerRegister from './pages/register/SeekerRegister';
import BusinessRegister from './pages/register/BusinessRegister';
import RecruiterRegister from './pages/register/RecruiterRegister';
import JobSeekerDashboard from './pages/job-seeker/JobSeekerDashboard';
import BusinessDashboard from './pages/business/BusinessDashboard';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import ProjectDetailsPage from './pages/projects/ProjectDetailsPage';
import ProjectApplicationPage from './pages/projects/ProjectApplicationPage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />}>
            <Route path="seeker" element={<SeekerLogin />} />
            <Route path="business" element={<BusinessLogin />} />
            <Route path="recruiter" element={<RecruiterLogin />} />
          </Route>
          <Route path="/register">
            <Route path="seeker" element={<SeekerRegister />} />
            <Route path="business" element={<BusinessRegister />} />
            <Route path="recruiter" element={<RecruiterRegister />} />
          </Route>
          <Route path="/seeker/dashboard" element={<JobSeekerDashboard />} />
          <Route path="/business/dashboard" element={<BusinessDashboard />} />
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/projects/:id" element={<ProjectDetailsPage />} />
          {/* Update or confirm the route for project application page */}
          <Route path="/projects/apply/:id" element={<ProjectApplicationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
