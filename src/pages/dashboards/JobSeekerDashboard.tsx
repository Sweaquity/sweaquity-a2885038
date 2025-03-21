
import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useJobSeekerDashboard } from "@/hooks/useJobSeekerDashboard";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

// Import components
import { DashboardHeaderWithActions } from "@/components/job-seeker/dashboard/DashboardHeaderWithActions";
import { DashboardHeader } from "@/components/job-seeker/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/job-seeker/dashboard/DashboardTabs";
import { DashboardTab } from "@/components/job-seeker/dashboard/tabs/DashboardTab";
import { ProfileTab } from "@/components/job-seeker/dashboard/tabs/ProfileTab";
import { ApplicationsTab } from "@/components/job-seeker/dashboard/tabs/ApplicationsTab";
import { OpportunitiesTab } from "@/components/job-seeker/dashboard/tabs/OpportunitiesTab";
import { DashboardSkeleton } from "@/components/job-seeker/dashboard/DashboardSkeleton";
import { BetaTestingTab } from "@/components/shared/beta-testing/BetaTestingTab";
import { supabase } from "@/lib/supabase";

const JobSeekerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || "dashboard");
  const [localLoading, setLocalLoading] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const {
    isLoading,
    profile,
    cvUrl,
    applications,
    equityProjects,
    availableOpportunities,
    parsedCvData,
    skills,
    handleSignOut,
    handleSkillsUpdate,
    refreshApplications,
    hasBusinessProfile,
    userCVs,
    onCvListUpdated
  } = useJobSeekerDashboard(forceRefresh);

  useEffect(() => {
    // Get the current user's ID for the BetaTestingTab
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/seeker/dashboard?tab=${value}`, { replace: true });
  };

  const handleApplicationUpdated = () => {
    setForceRefresh(prev => prev + 1);
  };

  const handleProfileSwitch = () => {
    navigate('/business/dashboard');
  };

  const handleDocumentAction = (projectId: string, action: 'edit' | 'approve') => {
    toast.info(`${action} action for document is not implemented yet`);
  };

  useEffect(() => {
    if (tabFromUrl && ['dashboard', 'profile', 'applications', 'opportunities', 'beta-testing'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setLocalLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  if (localLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen overflow-container dashboard-container">
      <div className="max-w-7xl mx-auto">
        <DashboardHeaderWithActions
          profile={profile}
          hasBusinessProfile={hasBusinessProfile}
          onProfileSwitch={handleProfileSwitch}
          onSignOut={handleSignOut}
        />

        <DashboardHeader
          profile={profile}
          onSignOut={handleSignOut}
        />

        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="mt-6 space-y-6"
        >
          <DashboardTabs 
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabs={[
              { id: "dashboard", label: "Dashboard" },
              { id: "profile", label: "Profile" },
              { id: "applications", label: "Applications" },
              { id: "opportunities", label: "Opportunities" },
              { id: "beta-testing", label: "Beta Testing" }
            ]}
          />

          <TabsContent value="dashboard">
            <DashboardTab
              activeTab={activeTab}
              profile={profile}
              cvUrl={cvUrl}
              parsedCvData={parsedCvData}
              skills={skills}
              applications={applications}
              equityProjects={equityProjects}
              availableOpportunities={availableOpportunities}
              handleSkillsUpdate={handleSkillsUpdate}
              refreshApplications={refreshApplications}
              onDocumentAction={handleDocumentAction}
              userCVs={userCVs}
              onCvListUpdated={onCvListUpdated}
            />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab
              profile={profile}
              cvUrl={cvUrl}
              skills={skills}
              parsedCvData={parsedCvData}
              onSkillsUpdate={handleSkillsUpdate}
              userCVs={userCVs}
              onCvListUpdated={onCvListUpdated}
            />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab
              applications={applications}
              onApplicationUpdated={handleApplicationUpdated}
            />
          </TabsContent>

          <TabsContent value="opportunities">
            <OpportunitiesTab
              projects={availableOpportunities}
              userSkills={skills || []}
            />
          </TabsContent>

          <TabsContent value="beta-testing">
            <BetaTestingTab 
              userType="job_seeker"
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
