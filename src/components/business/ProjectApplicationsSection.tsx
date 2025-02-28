
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Application {
  id: string;
  task_id: string;
  user_id: string;
  applied_at: string;
  status: string;
  message: string;
  cv_url: string | null;
  profile: {
    first_name: string;
    last_name: string;
    title: string;
    location: string;
    employment_preference: string;
  };
  business_roles: {
    title: string;
    description: string;
    project: {
      title: string;
    }
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  applications: Application[];
}

export const ProjectApplicationsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjectsWithApplications();
  }, []);

  const loadProjectsWithApplications = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // First, get all projects for this business
      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('*')
        .eq('business_id', session.user.id);

      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        setIsLoading(false);
        setProjects([]);
        return;
      }

      const projectsWithApplications: Project[] = [];

      // For each project, get its applications
      for (const project of projectsData) {
        // Get all tasks for this project
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('id')
          .eq('project_id', project.id);

        if (tasksError) {
          console.error('Error fetching tasks for project:', project.id, tasksError);
          continue;
        }

        const taskIds = tasksData.map(task => task.id);

        if (taskIds.length === 0) {
          projectsWithApplications.push({
            ...project,
            applications: []
          });
          continue;
        }

        // Get all applications for these tasks
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*')
          .in('task_id', taskIds);

        if (applicationsError) {
          console.error('Error fetching applications:', applicationsError);
          continue;
        }

        if (!applicationsData || applicationsData.length === 0) {
          projectsWithApplications.push({
            ...project,
            applications: []
          });
          continue;
        }

        // Now fetch profile data for each applicant
        const applicationsWithProfiles = [];

        for (const app of applicationsData) {
          // Get profile data
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
            .select('title, description')
            .eq('id', app.task_id)
            .single();

          if (taskError) {
            console.error('Error fetching task details:', taskError);
            continue;
          }

          applicationsWithProfiles.push({
            ...app,
            profile: profileData,
            business_roles: {
              ...taskData,
              project: {
                title: project.title
              }
            }
          });
        }

        projectsWithApplications.push({
          ...project,
          applications: applicationsWithProfiles
        });
      }

      setProjects(projectsWithApplications);
    } catch (error) {
      console.error('Error loading projects with applications:', error);
      toast.error("Failed to load applications data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Update local state
      setProjects(projects.map(project => ({
        ...project,
        applications: project.applications.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      })));
      
      toast.success(`Application status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error("Failed to update application status");
    }
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
      }
      return newExpanded;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Project Applications</h2>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <p>Loading applications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Project Applications</h2>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-center p-4">No projects found.</p>
        ) : (
          <div className="space-y-4">
            {projects.map(project => (
              <Collapsible 
                key={project.id} 
                open={expandedProjects.has(project.id)}
                onOpenChange={() => toggleProjectExpanded(project.id)}
                className="border rounded-lg overflow-hidden"
              >
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 text-left hover:bg-muted/50">
                  <div>
                    <h3 className="text-lg font-medium">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <p className="text-xs mt-1">
                      <Badge variant="outline" className="mr-2">
                        {project.applications.length} application{project.applications.length !== 1 ? 's' : ''}
                      </Badge>
                    </p>
                  </div>
                  {expandedProjects.has(project.id) ? 
                    <ChevronDown className="h-5 w-5 flex-shrink-0" /> : 
                    <ChevronRight className="h-5 w-5 flex-shrink-0" />
                  }
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  {project.applications.length === 0 ? (
                    <p className="text-muted-foreground text-center p-4">No applications for this project.</p>
                  ) : (
                    <div className="space-y-4">
                      {project.applications.map(application => (
                        <div key={application.id} className="border p-4 rounded-lg space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {application.cv_url && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(application.cv_url!, '_blank')}
                              >
                                View CV
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
