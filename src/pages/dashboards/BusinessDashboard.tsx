
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ProjectsSection } from "@/components/business/ProjectsSection";
import { BusinessProfileEditor } from "@/components/business/profile/BusinessProfileEditor";
import { TestingTab } from "@/components/business/testing/TestingTab";
import { ProjectApplicationsSection } from "@/components/business/ProjectApplicationsSection";
import { ActiveRolesTable } from "@/components/business/roles/ActiveRolesTable";
import { RequestAccessButton } from "@/components/business/users/RequestAccessButton";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface BusinessDashboardProps {}

interface BusinessProfileEditorProps {
  businessProfile: any;
  onUpdate: (updatedProfile: any) => void;
  isCompleting: boolean;
}

interface ProjectsSectionProps {
  businessId: string;
  onProjectSelect: (projectId: string) => void;
}

interface ActiveRolesTableProps {
  businessId: string;
}

const BusinessDashboard = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const projectIdFromUrl = searchParams.get('projectId');
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(tabFromUrl || "projects");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isParent, setIsParent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectIdFromUrl);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    const newTabFromUrl = searchParams.get('tab');
    if (newTabFromUrl && ['projects', 'applications', 'profile', 'roles', 'testing'].includes(newTabFromUrl)) {
      setActiveTab(newTabFromUrl);
    }
    
    const newProjectIdFromUrl = searchParams.get('projectId');
    if (newProjectIdFromUrl) {
      setActiveProjectId(newProjectIdFromUrl);
    }
  }, [searchParams]);

  const checkUser = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login/business');
        return;
      }

      setUser(user);

      // Get business profile
      const { data: business, error: profileError } = await supabase
        .from('businesses')
        .select('*')
        .eq('businesses_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching business profile:', profileError);
        toast.error('Failed to load business profile');
      }

      if (business) {
        setProfile(business);
        setIsParent(business.is_parent !== false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Failed to load user information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/business/dashboard?tab=${value}${activeProjectId ? `&projectId=${activeProjectId}` : ''}`, { replace: true });
  };

  const handleProjectSelect = (projectId: string) => {
    setActiveProjectId(projectId);
    if (activeTab !== 'applications') {
      setActiveTab('applications');
      navigate(`/business/dashboard?tab=applications&projectId=${projectId}`, { replace: true });
    } else {
      navigate(`/business/dashboard?tab=applications&projectId=${projectId}`, { replace: true });
    }
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    setProfile(updatedProfile);
  };

  const profileIsComplete = profile && 
    profile.company_name && 
    profile.company_size && 
    profile.industry &&
    profile.contact_email;

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show profile completion if profile is incomplete
  if (!profileIsComplete) {
    return (
      <div className="container mx-auto p-4">
        <BusinessProfileEditor 
          businessProfile={profile} 
          onUpdate={handleProfileUpdate} 
          isCompleting={true}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{profile?.company_name || 'Business Dashboard'}</h1>
          <p className="text-muted-foreground">{profile?.industry || 'Complete your profile'}</p>
        </div>
        <div className="flex space-x-2 mt-2 md:mt-0">
          {isParent && <RequestAccessButton businessId={user?.id} />}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <ProjectsSection 
            businessId={user?.id} 
            onProjectSelect={handleProjectSelect}
          />
        </TabsContent>

        <TabsContent value="applications">
          {activeProjectId ? (
            <ProjectApplicationsSection projectId={activeProjectId} />
          ) : (
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
              <p className="text-muted-foreground mb-4">
                Please select a project from the Projects tab to view applications.
              </p>
              <button
                onClick={() => handleTabChange('projects')}
                className="px-4 py-2 bg-primary text-white rounded-md"
              >
                Go to Projects
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles">
          <ActiveRolesTable businessId={user?.id} />
        </TabsContent>

        <TabsContent value="testing">
          <TestingTab />
        </TabsContent>

        <TabsContent value="profile">
          <BusinessProfileEditor 
            businessProfile={profile} 
            onUpdate={handleProfileUpdate}
            isCompleting={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessDashboard;
