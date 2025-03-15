
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useJobSeekerDashboard } from "@/hooks/useJobSeekerDashboard";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

// Import new components
import { DashboardHeaderWithActions } from "@/components/job-seeker/dashboard/DashboardHeaderWithActions";
import { DashboardHeader } from "@/components/job-seeker/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/job-seeker/dashboard/DashboardTabs";
import { DashboardTab } from "@/components/job-seeker/dashboard/tabs/DashboardTab";
import { ProfileTab } from "@/components/job-seeker/dashboard/tabs/ProfileTab";
import { ApplicationsTab } from "@/components/job-seeker/dashboard/tabs/ApplicationsTab";
import { OpportunitiesTab } from "@/components/job-seeker/dashboard/tabs/OpportunitiesTab";
import { DashboardSkeleton } from "@/components/job-seeker/dashboard/DashboardSkeleton";

const JobSeekerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || "dashboard");
  const [localLoading, setLocalLoading] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/seeker/dashboard?tab=${value}`, { replace: true });
  };

  const handleApplicationUpdated = useCallback(() => {
    setForceRefresh(prev => prev + 1);
  }, []);

  const handleProfileSwitch = () => {
    navigate('/business/dashboard');
  };

  const handleDocumentAction = (projectId: string, action: 'edit' | 'approve') => {
    toast.info(`${action} action for document is not implemented yet`);
  };

  useEffect(() => {
    if (tabFromUrl && ['dashboard', 'profile', 'applications', 'opportunities'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (!isLoading && !hasInitialized) {
      setHasInitialized(true);
      const timer = setTimeout(() => {
        setLocalLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasInitialized]);

  useEffect(() => {
    if (!hasInitialized) {
      const timer = setTimeout(() => {
        setLocalLoading(false);
        setHasInitialized(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [hasInitialized]);

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
        </Tabs>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
