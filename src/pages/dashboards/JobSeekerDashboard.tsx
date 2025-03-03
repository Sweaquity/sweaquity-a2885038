
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardContent } from "@/components/job-seeker/dashboard/DashboardContent";
import { useJobSeekerDashboard } from "@/hooks/useJobSeekerDashboard";
import { DashboardHeader } from "@/components/job-seeker/dashboard/DashboardHeader";
import { ProfileSection } from "@/components/job-seeker/ProfileSection";
import { ApplicationsTab } from "@/components/job-seeker/dashboard/applications";
import { EquityTab } from "@/components/job-seeker/dashboard/EquityTab";
import { OpportunitiesTab } from "@/components/job-seeker/dashboard/OpportunitiesTab";
import { ProjectsOverview } from "@/components/job-seeker/ProjectsOverview";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Building2, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const JobSeekerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || "dashboard");
  const [localLoading, setLocalLoading] = useState(true);
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
    refreshApplications,
    hasBusinessProfile
  } = useJobSeekerDashboard(forceRefresh);

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
    if (tabFromUrl && ['dashboard', 'profile', 'applications', 'opportunities'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Update local loading state when the main loading state changes
  useEffect(() => {
    if (!isLoading) {
      // Add a small delay to prevent flicker
      const timer = setTimeout(() => {
        setLocalLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleDocumentAction = (projectId: string, action: 'edit' | 'approve') => {
    toast.info(`${action} action for document is not implemented yet`);
  };

  // Force end loading state after maximum 3 seconds for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  if (localLoading) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-36 w-full mb-6" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold">
            Job Seeker Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4">
              {hasBusinessProfile && (
                <Button variant="outline" onClick={handleProfileSwitch}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Switch to Business
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
            
            <div className="flex md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasBusinessProfile && (
                    <DropdownMenuItem onClick={handleProfileSwitch}>
                      <Building2 className="mr-2 h-4 w-4" />
                      Switch to Business
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

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
              activeTab={activeTab}
              dashboardData={{
                profile,
                cvUrl,
                parsedCvData,
                setCvUrl: () => {},
                setParsedCvData: () => {},
                skills,
                handleSkillsUpdate,
                applications,
                availableOpportunities,
                equityProjects,
                logEffort: null,
                onLogEffort: () => {},
                onLogEffortChange: () => {}
              }}
              refreshApplications={refreshApplications}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSection
              profile={profile}
              cvUrl={cvUrl}
              skills={skills}
              parsedCvData={parsedCvData}
              onSkillsUpdate={handleSkillsUpdate}
              setCvUrl={() => {}}
              setParsedCvData={() => {}}
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
            <OpportunitiesTab projects={availableOpportunities} userSkills={skills || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
