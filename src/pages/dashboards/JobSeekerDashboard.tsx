
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
import { OpportunitiesTab } from "@/components/job-seeker/dashboard/OpportunitiesTab";
import { DashboardSkeleton } from "@/components/job-seeker/dashboard/DashboardSkeleton";
import { JobSeekerProjectsTab } from "@/components/job-seeker/dashboard/tabs/JobSeekerProjectsTab";
import { supabase } from "@/lib/supabase";

const JobSeekerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  // Changed the default tab to "profile"
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || "profile");
  const [localLoading, setLocalLoading] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [newOpportunities, setNewOpportunities] = useState(0);

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
    onCvListUpdated,
    handleTicketAction
  } = useJobSeekerDashboard(forceRefresh);

  useEffect(() => {
    // Get the current user's ID for the JobSeekerProjectsTab
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  // Calculate notifications for tabs
  useEffect(() => {
    // Count applications that need attention
    const pendingAcceptance = applications.filter(app => 
      app.status === 'accepted' && app.accepted_business && !app.accepted_jobseeker
    ).length;
    
    setPendingApplications(pendingAcceptance);
    
    // Count new opportunities based on recent creation date
    // This is a placeholder. In a real implementation, you'd track which opportunities the user has seen
    const recentOpportunities = availableOpportunities ? 
      availableOpportunities.filter(opp => {
        // Check for updated_at since created_at might not exist
        const creationDate = opp.updated_at || null;
        if (!creationDate) return false;
        return new Date(creationDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }).length : 0;
    
    setNewOpportunities(recentOpportunities > 0 ? recentOpportunities : 0);
  }, [applications, availableOpportunities]);

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

  useEffect(() => {
    // Updated array to include the "live-projects" tab for new tab order
    if (tabFromUrl && ['profile', 'opportunities', 'applications', 'live-projects'].includes(tabFromUrl)) {
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
              { id: "profile", label: "Profile" },
              { id: "opportunities", label: "Opportunities", notificationCount: newOpportunities > 0 ? newOpportunities : undefined },
              { id: "applications", label: "Applications", notificationCount: pendingApplications > 0 ? pendingApplications : undefined },
              { id: "live-projects", label: "Live Projects" }
            ]}
          />

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

          <TabsContent value="opportunities">
            <OpportunitiesTab
              projects={availableOpportunities}
              userSkills={skills || []}
            />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab
              applications={applications}
              onApplicationUpdated={handleApplicationUpdated}
            />
          </TabsContent>

          <TabsContent value="live-projects">
            <JobSeekerProjectsTab userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
