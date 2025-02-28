
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardContent } from "@/components/job-seeker/dashboard/DashboardContent";
import { useJobSeekerDashboard } from "@/hooks/useJobSeekerDashboard";
import { DashboardHeader } from "@/components/job-seeker/dashboard/DashboardHeader";
import { ProfileSection } from "@/components/job-seeker/ProfileSection";
import { ApplicationsTab } from "@/components/job-seeker/dashboard/ApplicationsTab";
import { EquityTab } from "@/components/job-seeker/dashboard/EquityTab";
import { OpportunitiesTab } from "@/components/job-seeker/dashboard/OpportunitiesTab";
import { ProjectsOverview } from "@/components/job-seeker/ProjectsOverview";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProfileCompletionForm } from "@/components/job-seeker/ProfileCompletionForm";

const JobSeekerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || "dashboard");
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  
  const {
    isLoading,
    profile,
    cvUrl,
    applications,
    equityProjects,
    availableOpportunities,
    pastApplications,
    parsedCvData,
    skills,
    handleSignOut,
    handleSkillsUpdate,
    refreshApplications
  } = useJobSeekerDashboard(forceRefresh);

  // Handle tab changes by updating the URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/seeker/dashboard?tab=${value}`, { replace: true });
  };

  // Handle application updates
  const handleApplicationUpdated = () => {
    setForceRefresh(prev => prev + 1);
  };

  useEffect(() => {
    // Set the active tab based on URL params
    if (tabFromUrl && ['dashboard', 'profile', 'applications', 'opportunities'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    // Check authentication and profile completion
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth/seeker');
          return;
        }

        // Check if profile is complete
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, title, location, terms_accepted')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        // Check if required fields are filled
        const isComplete = !!profileData.first_name && 
                         !!profileData.last_name && 
                         !!profileData.terms_accepted;
        
        setProfileComplete(isComplete);
        
        // Normalize the state from location into activeTab
        const { state } = location;
        if (state && state.activeTab) {
          setActiveTab(state.activeTab);
          navigate(`/seeker/dashboard?tab=${state.activeTab}`, { replace: true });
        }
        
        setIsRedirecting(false);
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error("Authentication check failed");
        navigate('/auth/seeker');
      }
    };

    checkAuth();
  }, [navigate, location]);

  // If user session is being checked or loading data, show loading state
  if (isLoading || isRedirecting) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If profile is incomplete, show the profile completion form
  if (!profileComplete) {
    return <ProfileCompletionForm />;
  }

  // Function for document actions (not implemented yet)
  const handleDocumentAction = (projectId: string, action: 'edit' | 'approve') => {
    console.log(`Document action: ${action} for project ${projectId}`);
    toast.info(`${action} action for document is not implemented yet`);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          profile={profile}
          onSignOut={handleSignOut}
        />

        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="mt-6 space-y-6"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <ProjectsOverview 
              currentProjects={equityProjects} 
              pastProjects={[]} 
              onDocumentAction={handleDocumentAction}
            />
            <DashboardContent
              profile={profile}
              applications={applications}
              equityProjects={equityProjects}
              onViewProfile={() => handleTabChange("profile")}
              onViewApplications={() => handleTabChange("applications")}
              onViewOpportunities={() => handleTabChange("opportunities")}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSection
              profile={profile}
              cvUrl={cvUrl}
              skills={skills}
              parsedCvData={parsedCvData}
              onSkillsUpdate={handleSkillsUpdate}
            />
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <ApplicationsTab 
              applications={applications} 
              onApplicationUpdated={handleApplicationUpdated}
            />
            <EquityTab equityProjects={equityProjects} />
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <OpportunitiesTab projects={availableOpportunities} userSkills={skills} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
