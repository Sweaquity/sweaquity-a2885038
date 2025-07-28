// Auto-generated route mapping and issue detection
// Generated on 2025-07-28T11:04:21.304Z

interface RelevantCodeFile {
  path: string;
  type: 'component' | 'page' | 'hook' | 'util' | 'api' | 'service' | 'store';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

const ROUTE_TO_FILES_MAP: Record<string, RelevantCodeFile[]> = {
  '/seeker/dashboard?tab=applications': [
    { path: 'src/pages/Login/Seeker.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard?tab=applications' },
    { path: 'src/pages/Register/Seeker.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard?tab=applications' },
    { path: 'src/pages/dashboards/JobSeekerDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard?tab=applications' },
    { path: 'src/components/job-seeker/ApplicationsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard?tab=applications' },
    { path: 'src/components/job-seeker/EquityProjectsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard?tab=applications' },
    { path: 'src/components/job-seeker/ProfileCompletionForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard?tab=applications' },
    { path: 'src/components/job-seeker/ProfileSection.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard?tab=applications' },
    { path: 'src/components/job-seeker/ProjectsOverview.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard?tab=applications' },
    { path: 'src/hooks/job-seeker/dashboard/useJobSeekerDashboardCore.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /seeker/dashboard?tab=applications data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useOpportunitiesLoader.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /seeker/dashboard?tab=applications data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useSessionCheck.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /seeker/dashboard?tab=applications data/logic' },
  ],

  '/seeker/profile/complete': [
    { path: 'src/pages/Login/Seeker.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/profile/complete' },
    { path: 'src/pages/ProfileCompletePage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/profile/complete' },
    { path: 'src/pages/Register/Seeker.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/profile/complete' },
    { path: 'src/pages/dashboards/JobSeekerDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/profile/complete' },
    { path: 'src/components/business/BusinessProfileCompletion.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/profile/complete' },
    { path: 'src/components/business/BusinessProfileEditor.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/profile/complete' },
    { path: 'src/components/business/profile/BusinessProfileEditor.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/profile/complete' },
    { path: 'src/components/job-seeker/ApplicationsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/profile/complete' },
    { path: 'src/components/job-seeker/EquityProjectsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/profile/complete' },
    { path: 'src/hooks/job-seeker/dashboard/useJobSeekerDashboardCore.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /seeker/profile/complete data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useOpportunitiesLoader.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /seeker/profile/complete data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useSessionCheck.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /seeker/profile/complete data/logic' },
  ],

  '/recruiter/dashboard': [
    { path: 'src/pages/Login/Recruiter.tsx', type: 'page', confidence: 'high', reason: 'Page component for /recruiter/dashboard' },
    { path: 'src/pages/Register/Recruiter.tsx', type: 'page', confidence: 'high', reason: 'Page component for /recruiter/dashboard' },
    { path: 'src/pages/dashboards/AdminDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /recruiter/dashboard' },
    { path: 'src/pages/dashboards/BusinessDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /recruiter/dashboard' },
    { path: 'src/pages/dashboards/JobSeekerDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /recruiter/dashboard' },
    { path: 'src/pages/dashboards/RecruiterDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /recruiter/dashboard' },
    { path: 'src/pages/dashboards/SweaquityDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /recruiter/dashboard' },
    { path: 'src/components/business/dashboard/tabs/BetaTestingTab.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /recruiter/dashboard' },
    { path: 'src/components/dashboard/TicketAttachmentsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /recruiter/dashboard' },
    { path: 'src/components/job-seeker/dashboard/DashboardContent.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /recruiter/dashboard' },
    { path: 'src/components/job-seeker/dashboard/DashboardHeader.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /recruiter/dashboard' },
    { path: 'src/components/job-seeker/dashboard/DashboardHeaderWithActions.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /recruiter/dashboard' },
    { path: 'src/hooks/job-seeker/dashboard/useJobSeekerDashboardCore.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /recruiter/dashboard data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useOpportunitiesLoader.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /recruiter/dashboard data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useSessionCheck.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /recruiter/dashboard data/logic' },
  ],

  '/business/dashboard': [
    { path: 'src/pages/Login/Business.tsx', type: 'page', confidence: 'high', reason: 'Page component for /business/dashboard' },
    { path: 'src/pages/Register/Business.tsx', type: 'page', confidence: 'high', reason: 'Page component for /business/dashboard' },
    { path: 'src/pages/dashboards/AdminDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /business/dashboard' },
    { path: 'src/pages/dashboards/BusinessDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /business/dashboard' },
    { path: 'src/pages/dashboards/JobSeekerDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /business/dashboard' },
    { path: 'src/pages/dashboards/RecruiterDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /business/dashboard' },
    { path: 'src/pages/dashboards/SweaquityDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /business/dashboard' },
    { path: 'src/components/business/ActiveRolesTable.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /business/dashboard' },
    { path: 'src/components/business/BusinessProfileCompletion.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /business/dashboard' },
    { path: 'src/components/business/BusinessProfileEditor.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /business/dashboard' },
    { path: 'src/components/business/ProjectApplicationsSection.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /business/dashboard' },
    { path: 'src/components/business/ProjectsSection.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /business/dashboard' },
    { path: 'src/hooks/job-seeker/dashboard/useJobSeekerDashboardCore.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /business/dashboard data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useOpportunitiesLoader.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /business/dashboard data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useSessionCheck.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /business/dashboard data/logic' },
  ],

  '/seeker/dashboard': [
    { path: 'src/pages/Login/Seeker.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard' },
    { path: 'src/pages/Register/Seeker.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard' },
    { path: 'src/pages/dashboards/AdminDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard' },
    { path: 'src/pages/dashboards/BusinessDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard' },
    { path: 'src/pages/dashboards/JobSeekerDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard' },
    { path: 'src/pages/dashboards/RecruiterDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard' },
    { path: 'src/pages/dashboards/SweaquityDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /seeker/dashboard' },
    { path: 'src/components/business/dashboard/tabs/BetaTestingTab.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard' },
    { path: 'src/components/dashboard/TicketAttachmentsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard' },
    { path: 'src/components/job-seeker/ApplicationsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard' },
    { path: 'src/components/job-seeker/EquityProjectsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard' },
    { path: 'src/components/job-seeker/ProfileCompletionForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /seeker/dashboard' },
    { path: 'src/hooks/job-seeker/dashboard/useJobSeekerDashboardCore.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /seeker/dashboard data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useOpportunitiesLoader.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /seeker/dashboard data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useSessionCheck.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /seeker/dashboard data/logic' },
  ],

  '/projects/apply': [
    { path: 'src/pages/projects/ProjectApplicationPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /projects/apply' },
    { path: 'src/pages/projects/ProjectDetailsPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /projects/apply' },
    { path: 'src/components/business/ProjectsSection.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects/apply' },
    { path: 'src/components/business/applications/ActiveProjectsTable.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects/apply' },
    { path: 'src/components/business/projects/BetaTestingTab.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects/apply' },
    { path: 'src/components/business/projects/LiveProjectsTab.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects/apply' },
    { path: 'src/components/business/projects/ProjectCard.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects/apply' },
    { path: 'src/hooks/job-seeker/useEquityProjects.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /projects/apply data/logic' },
  ],

  '/auth/recruiter': [
    { path: 'src/pages/Auth.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/recruiter' },
    { path: 'src/pages/AuthPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/recruiter' },
    { path: 'src/pages/Login/Recruiter.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/recruiter' },
    { path: 'src/pages/Register/Recruiter.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/recruiter' },
    { path: 'src/pages/dashboards/RecruiterDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/recruiter' },
    { path: 'src/components/auth/LoginForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/recruiter' },
    { path: 'src/components/auth/RegisterForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/recruiter' },
  ],

  '/auth/business': [
    { path: 'src/pages/Auth.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/business' },
    { path: 'src/pages/AuthPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/business' },
    { path: 'src/pages/Login/Business.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/business' },
    { path: 'src/pages/Register/Business.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/business' },
    { path: 'src/pages/dashboards/BusinessDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/business' },
    { path: 'src/components/auth/LoginForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/business' },
    { path: 'src/components/auth/RegisterForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/business' },
    { path: 'src/components/business/ActiveRolesTable.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/business' },
    { path: 'src/components/business/BusinessProfileCompletion.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/business' },
    { path: 'src/components/business/BusinessProfileEditor.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/business' },
  ],

  '/auth/seeker': [
    { path: 'src/pages/Auth.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/seeker' },
    { path: 'src/pages/AuthPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/seeker' },
    { path: 'src/pages/Login/Seeker.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/seeker' },
    { path: 'src/pages/Register/Seeker.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/seeker' },
    { path: 'src/pages/dashboards/JobSeekerDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth/seeker' },
    { path: 'src/components/auth/LoginForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/seeker' },
    { path: 'src/components/auth/RegisterForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/seeker' },
    { path: 'src/components/job-seeker/ApplicationsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/seeker' },
    { path: 'src/components/job-seeker/EquityProjectsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/seeker' },
    { path: 'src/components/job-seeker/ProfileCompletionForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth/seeker' },
    { path: 'src/hooks/job-seeker/dashboard/useJobSeekerDashboardCore.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /auth/seeker data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useOpportunitiesLoader.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /auth/seeker data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useSessionCheck.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /auth/seeker data/logic' },
  ],

  '/sweaquity': [
    { path: 'src/pages/dashboards/SweaquityDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /sweaquity' },
  ],

  '/dashboard': [
    { path: 'src/pages/dashboards/AdminDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /dashboard' },
    { path: 'src/pages/dashboards/BusinessDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /dashboard' },
    { path: 'src/pages/dashboards/JobSeekerDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /dashboard' },
    { path: 'src/pages/dashboards/RecruiterDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /dashboard' },
    { path: 'src/pages/dashboards/SweaquityDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /dashboard' },
    { path: 'src/components/business/dashboard/tabs/BetaTestingTab.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /dashboard' },
    { path: 'src/components/dashboard/TicketAttachmentsList.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /dashboard' },
    { path: 'src/components/job-seeker/dashboard/DashboardContent.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /dashboard' },
    { path: 'src/components/job-seeker/dashboard/DashboardHeader.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /dashboard' },
    { path: 'src/components/job-seeker/dashboard/DashboardHeaderWithActions.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /dashboard' },
    { path: 'src/hooks/job-seeker/dashboard/useJobSeekerDashboardCore.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /dashboard data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useOpportunitiesLoader.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /dashboard data/logic' },
    { path: 'src/hooks/job-seeker/dashboard/useSessionCheck.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /dashboard data/logic' },
  ],

  '/projects': [
    { path: 'src/pages/projects/ProjectApplicationPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /projects' },
    { path: 'src/pages/projects/ProjectDetailsPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /projects' },
    { path: 'src/components/business/ProjectsSection.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects' },
    { path: 'src/components/business/applications/ActiveProjectsTable.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects' },
    { path: 'src/components/business/projects/BetaTestingTab.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects' },
    { path: 'src/components/business/projects/LiveProjectsTab.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects' },
    { path: 'src/components/business/projects/ProjectCard.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /projects' },
    { path: 'src/hooks/job-seeker/useEquityProjects.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /projects data/logic' },
  ],

  '/project': [
    { path: 'src/pages/projects/ProjectApplicationPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /project' },
    { path: 'src/pages/projects/ProjectDetailsPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /project' },
    { path: 'src/components/business/ProjectApplicationsSection.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /project' },
    { path: 'src/components/business/ProjectsSection.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /project' },
    { path: 'src/components/business/applications/ActiveProjectsTable.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /project' },
    { path: 'src/components/business/projects/BetaTestingTab.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /project' },
    { path: 'src/components/business/projects/LiveProjectsTab.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /project' },
    { path: 'src/hooks/job-seeker/useEquityProjects.ts', type: 'hook', confidence: 'medium', reason: 'Hook for /project data/logic' },
  ],

  '/admin': [
    { path: 'src/pages/dashboards/AdminDashboard.tsx', type: 'page', confidence: 'high', reason: 'Page component for /admin' },
    { path: 'src/components/admin/tickets/AdminTicketManager.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /admin' },
  ],

  '/login': [
    { path: 'src/pages/Login/Business.tsx', type: 'page', confidence: 'high', reason: 'Page component for /login' },
    { path: 'src/pages/Login/Recruiter.tsx', type: 'page', confidence: 'high', reason: 'Page component for /login' },
    { path: 'src/pages/Login/Seeker.tsx', type: 'page', confidence: 'high', reason: 'Page component for /login' },
    { path: 'src/components/auth/LoginForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /login' },
  ],

  '/auth': [
    { path: 'src/pages/Auth.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth' },
    { path: 'src/pages/AuthPage.tsx', type: 'page', confidence: 'high', reason: 'Page component for /auth' },
    { path: 'src/components/auth/LoginForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth' },
    { path: 'src/components/auth/RegisterForm.tsx', type: 'component', confidence: 'medium', reason: 'Component related to /auth' },
  ],

};

const COMMON_FILES: RelevantCodeFile[] = [
  { path: 'src/App.tsx', type: 'component', confidence: 'low', reason: 'Global component: App.tsx' },
  { path: 'src/components/job-seeker/dashboard/applications/index.tsx', type: 'component', confidence: 'low', reason: 'Global component: index.tsx' },
  { path: 'src/pages/Index.tsx', type: 'component', confidence: 'low', reason: 'Global component: Index.tsx' },
];

export { ROUTE_TO_FILES_MAP, COMMON_FILES };
