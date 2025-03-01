
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProjectsSection } from "@/components/business/ProjectsSection";
import { BusinessProfileCompletion } from "@/components/business/BusinessProfileCompletion";
import { UserCircle2, Menu } from "lucide-react";
import { ActiveRolesTable } from "@/components/business/roles/ActiveRolesTable";
import { ProjectApplicationsSection } from "@/components/business/ProjectApplicationsSection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubTask {
  id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  timeframe: string;
  skill_requirements: Array<{ skill: string; level: string }>;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  tasks: SubTask[];
  equity_allocation: number;
  skills_required: string[];
}

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [businessData, setBusinessData] = useState<any>(null);
  const [hasJobSeekerProfile, setHasJobSeekerProfile] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/business');
        return;
      }

      try {
        // Check business profile - fixing the query to use businesses_id instead of id
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('businesses_id', session.user.id)
          .single();

        if (businessError) throw businessError;
        setBusinessData(businessData);

        // Load projects for this business
        const { data: projectsData, error: projectsError } = await supabase
          .from('business_projects')
          .select('*')
          .eq('business_id', session.user.id);

        if (projectsError) throw projectsError;
        
        if (projectsData && projectsData.length > 0) {
          const projectIds = projectsData.map(p => p.id);

          // Get all tasks for these projects
          const { data: tasksData, error: tasksError } = await supabase
            .from('project_sub_tasks')
            .select('*')
            .in('project_id', projectIds);

          if (tasksError) throw tasksError;

          const projectsWithTasks = projectsData.map((project: any) => ({
            ...project,
            tasks: tasksData.filter((task: any) => task.project_id === project.id) || []
          }));

          setProjects(projectsWithTasks);
        }

        // Check if user has a job seeker profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        setHasJobSeekerProfile(!!profileData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      navigate('/auth/business');
    }
  };

  const handleProfileSwitch = () => {
    navigate('/seeker/dashboard');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!businessData?.company_name || !businessData?.industry || !businessData?.terms_accepted) {
    return <BusinessProfileCompletion />;
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold">
            {businessData?.company_name} Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {/* Desktop view */}
            <div className="hidden md:flex items-center gap-4">
              {hasJobSeekerProfile && (
                <Button variant="outline" onClick={handleProfileSwitch}>
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  Switch to Job Seeker
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
            
            {/* Mobile view */}
            <div className="flex md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasJobSeekerProfile && (
                    <DropdownMenuItem onClick={handleProfileSwitch}>
                      <UserCircle2 className="mr-2 h-4 w-4" />
                      Switch to Job Seeker
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

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Active Roles</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h2 className="text-lg font-semibold">Business Details</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Company Name</p>
                      <p>{businessData.company_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Industry</p>
                      <p>{businessData.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Project Stage</p>
                      <p>{businessData.project_stage || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Website</p>
                      <p>{businessData.website || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Contact Phone</p>
                      <p>{businessData.contact_phone || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Location</p>
                      <p>{businessData.location || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h2 className="text-lg font-semibold">Banking Details</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Account Name</p>
                      <p>{businessData.banking_details?.account_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Account Number</p>
                      <p>{businessData.banking_details?.account_number || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Sort Code</p>
                      <p>{businessData.banking_details?.sort_code || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Bank Name</p>
                      <p>{businessData.banking_details?.bank_name || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsSection />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Business Users</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User management coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Active Project Roles</h2>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <p className="text-muted-foreground">No active projects found.</p>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="mb-6">
                      <h3 className="text-lg font-medium mb-2">{project.title}</h3>
                      {project.tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tasks available for this project.</p>
                      ) : (
                        <ActiveRolesTable project={project} />
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <ProjectApplicationsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BusinessDashboard;
