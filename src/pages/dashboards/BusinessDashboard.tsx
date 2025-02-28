
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProjectsSection } from "@/components/business/ProjectsSection";
import { BusinessProfileCompletion } from "@/components/business/BusinessProfileCompletion";
import { UserCircle2, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ActiveRolesTable } from "@/components/business/roles/ActiveRolesTable";

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
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/business');
        return;
      }

      try {
        // Check business profile
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (businessError) throw businessError;
        setBusinessData(businessData);

        console.log("Business ID:", session.user.id);
        console.log("Business data:", businessData);

        // Load projects for this business
        const { data: projectsData, error: projectsError } = await supabase
          .from('business_projects')
          .select('*')
          .eq('business_id', session.user.id);

        if (projectsError) throw projectsError;
        
        console.log("Projects data:", projectsData);

        if (!projectsData || projectsData.length === 0) {
          console.log("No projects found for this business");
          setIsLoading(false);
          return;
        }

        const projectIds = projectsData.map(p => p.id);
        console.log("Project IDs:", projectIds);

        // Get all tasks for these projects
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .in('project_id', projectIds);

        if (tasksError) throw tasksError;
        
        console.log("Tasks data:", tasksData);

        // Get all applications for these projects
        const { data: rawApplicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*, user:user_id(*)')
          .in('project_id', projectIds);

        if (applicationsError) {
          console.error('Error fetching applications:', applicationsError);
          throw applicationsError;
        }
        
        console.log("Raw applications data:", rawApplicationsData);
        
        // Now fetch the profile data for each applicant
        const applicationsWithProfiles = [];
        
        for (const app of rawApplicationsData) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, title, location, employment_preference')
            .eq('id', app.user_id)
            .single();
            
          if (profileError) {
            console.error('Error fetching profile for user:', app.user_id, profileError);
            continue;
          }
          
          // Get task details
          const { data: taskData, error: taskError } = await supabase
            .from('project_sub_tasks')
            .select('*')
            .eq('id', app.task_id)
            .single();
            
          if (taskError) {
            console.error('Error fetching task details:', taskError);
            continue;
          }
          
          // Get project details
          const { data: projectData, error: projectError } = await supabase
            .from('business_projects')
            .select('title')
            .eq('id', app.project_id)
            .single();
            
          if (projectError) {
            console.error('Error fetching project details:', projectError);
            continue;
          }
          
          applicationsWithProfiles.push({
            ...app,
            profile: profileData,
            business_roles: {
              ...taskData,
              project: {
                title: projectData.title
              }
            }
          });
        }
        
        console.log("Applications with profiles:", applicationsWithProfiles);
        setApplications(applicationsWithProfiles);

        const projectsWithTasks = projectsData.map((project: any) => ({
          ...project,
          tasks: tasksData.filter((task: any) => task.project_id === project.id) || []
        }));

        setProjects(projectsWithTasks);

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

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      toast.success(`Application status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error("Failed to update application status");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!businessData?.company_name || !businessData?.industry || !businessData?.terms_accepted) {
    return <BusinessProfileCompletion />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {businessData?.company_name} Dashboard
          </h1>
          <div className="flex items-center gap-4">
            {hasJobSeekerProfile && (
              <Button variant="outline" onClick={handleProfileSwitch}>
                <UserCircle2 className="mr-2 h-4 w-4" />
                Switch to Job Seeker
              </Button>
            )}
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
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
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <Collapsible key={project.id} className="mb-4">
                      <CollapsibleTrigger className="flex justify-between items-center w-full p-4 rounded-lg bg-secondary">
                        <div>
                          <h3 className="text-lg font-medium">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        </div>
                        <ChevronDown className="h-5 w-5" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        {project.tasks.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-4">No tasks available for this project.</p>
                        ) : (
                          <ActiveRolesTable project={project} />
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Applications</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length > 0 ? (
                    applications.map((application) => (
                      <div key={application.id} className="border p-4 rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium text-sm text-muted-foreground">Applicant</p>
                            <p className="font-medium">{application.profile?.first_name} {application.profile?.last_name}</p>
                            <p className="text-sm text-muted-foreground">{application.profile?.title}</p>
                            <p className="text-sm text-muted-foreground">{application.profile?.location}</p>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-muted-foreground">Role Details</p>
                            <p className="font-medium">{application.business_roles?.title}</p>
                            <p className="text-sm text-muted-foreground">{application.business_roles?.project?.title}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Application Message</p>
                          <p className="text-sm">{application.message}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="space-x-2">
                            <Badge>{application.status}</Badge>
                            <Badge variant="outline">
                              {application.profile?.employment_preference}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <select 
                              className="px-2 py-1 border rounded text-sm"
                              value={application.status}
                              onChange={(e) => handleStatusChange(application.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="in review">In Review</option>
                              <option value="negotiation">Negotiation</option>
                              <option value="accepted">Accepted</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <p className="text-sm text-muted-foreground">
                              Applied {new Date(application.applied_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No applications found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BusinessDashboard;
