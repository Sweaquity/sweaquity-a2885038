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
import { RequestAccessButton } from "@/components/business/users/RequestAccessButton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountSettingsCard } from "@/components/shared/AccountSettingsCard";
import { BusinessProfileEditor } from "@/components/business/profile/BusinessProfileEditor";
import { LiveProjectsTab } from "@/components/business/projects/LiveProjectsTab";

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
  equity_allocated: number;
  skills_required: string[];
}

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [businessData, setBusinessData] = useState<any>(null);
  const [hasJobSeekerProfile, setHasJobSeekerProfile] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newApplicationsCount, setNewApplicationsCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("account");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/business');
        return;
      }

      setUserId(session.user.id);

      try {
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('businesses_id', session.user.id)
          .maybeSingle();

        if (businessError) throw businessError;
        
        console.log("Business profile check:", businessData);
        setBusinessData(businessData);

        const { data: projectsData, error: projectsError } = await supabase
          .from('business_projects')
          .select('*')
          .eq('business_id', session.user.id);

        if (projectsError) throw projectsError;
        
        if (projectsData && projectsData.length > 0) {
          const projectIds = projectsData.map((p: any) => p.project_id);

          const { data: tasksData, error: tasksError } = await supabase
            .from('project_sub_tasks')
            .select('*')
            .in('project_id', projectIds);

          if (tasksError) throw tasksError;

          const projectsWithTasks = projectsData.map((project: any) => ({
            ...project,
            tasks: tasksData.filter((task: any) => task.project_id === project.project_id) || []
          }));

          setProjects(projectsWithTasks);
        }

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const { data: recentApps, error: recentAppsError } = await supabase
          .from('job_applications')
          .select('applied_at, task_discourse, status')
          .gte('applied_at', oneDayAgo.toISOString())
          .eq('status', 'pending');
          
        if (recentAppsError) throw recentAppsError;
        
        setNewApplicationsCount(recentApps?.length || 0);
        
        const { data: recentMsgs, error: recentMsgsError } = await supabase
          .from('job_applications')
          .select('task_discourse, updated_at')
          .gte('updated_at', oneDayAgo.toISOString())
          .neq('task_discourse', null);
          
        if (recentMsgsError) throw recentMsgsError;
        
        const newMsgs = recentMsgs?.filter(msg => {
          if (!msg.task_discourse) return false;
          
          const lastMessageMatch = msg.task_discourse.match(/\[([^\]]+)\]/);
          if (lastMessageMatch) {
            try {
              const msgDate = new Date(lastMessageMatch[1]);
              return msgDate > oneDayAgo;
            } catch (e) {
              return false;
            }
          }
          return false;
        });
        
        setNewMessagesCount(newMsgs?.length || 0);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        console.log("Job seeker profile check:", profileData);
        setHasJobSeekerProfile(!!profileData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_applications'
        },
        () => {
          setNewApplicationsCount(prev => prev + 1);
          toast.info("New application received!");
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_applications',
          filter: 'task_discourse=neq.null'
        },
        () => {
          setNewMessagesCount(prev => prev + 1);
          toast.info("New message received!");
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
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
    console.log("Switching to job seeker profile");
    navigate('/seeker/dashboard');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'applications') {
      setNewApplicationsCount(0);
    }
    if (value === 'roles') {
      setNewMessagesCount(0);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (isEditingProfile) {
    return <BusinessProfileCompletion />;
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
            <div className="hidden md:flex items-center gap-4">
              {hasJobSeekerProfile && (
                <Button variant="outline" onClick={handleProfileSwitch}>
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  Switch to Job Seeker
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

        <Tabs value={activeTab} className="space-y-6" onValueChange={handleTabChange}>
          <TabsList className="w-full grid grid-cols-6 md:flex md:w-auto">
            <TabsTrigger value="account" className="px-3 py-1.5">Account</TabsTrigger>
            <TabsTrigger value="users" className="px-3 py-1.5">Users</TabsTrigger>
            <TabsTrigger value="projects" className="px-3 py-1.5">Projects</TabsTrigger>
            <TabsTrigger value="applications" className="px-3 py-1.5 relative">
              Applications
              {newApplicationsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 rounded-full">
                  {newApplicationsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="roles" className="px-3 py-1.5 relative">
              Active Roles
              {newMessagesCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 rounded-full">
                  {newMessagesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="live-projects" className="px-3 py-1.5">Live Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h2 className="text-lg font-semibold">Business Details</h2>
                </CardHeader>
                <CardContent>
                  <div className="p-2">
                    <BusinessProfileEditor
                      businessProfile={businessData}
                      onProfileUpdate={() => {
                        toast.success("Profile updated successfully");
                        window.location.reload();
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <AccountSettingsCard userType="business" />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-lg font-semibold">Business Users</h2>
                <RequestAccessButton />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No users have been added to your business yet. Use the "Request Access" button to invite team members.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsSection />
          </TabsContent>

          <TabsContent value="applications">
            <ProjectApplicationsSection />
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Active Project Roles</h2>
                <div className="text-sm text-muted-foreground">
                  These are the projects with active applications on live projects, and the progress of completion of the projects.
                </div>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <p className="text-muted-foreground">No active projects found.</p>
                ) : (
                  projects.map((project, index) => (
                    <div key={project.id || index} className="mb-6">
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

          <TabsContent value="live-projects">
            <LiveProjectsTab businessId={userId || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BusinessDashboard;
