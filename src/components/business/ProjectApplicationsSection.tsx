
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skill } from "@/types/jobSeeker";

interface Application {
  job_app_id: string; // Changed from id to job_app_id
  task_id: string;
  user_id: string;
  applied_at: string;
  status: string;
  message: string;
  cv_url: string | null;
  skillMatch?: number;
  profile: {
    first_name: string;
    last_name: string;
    title: string;
    location: string;
    employment_preference: string;
    skills?: Skill[];
  };
  business_roles: {
    title: string;
    description: string;
    skills_required?: string[];
    project: {
      title: string;
    }
  };
}

interface Project {
  project_id: string; // Changed from id to project_id
  title: string;
  description: string;
  skills_required?: string[];
  applications: Application[];
}

export const ProjectApplicationsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjectsWithApplications();
  }, []);

  const loadProjectsWithApplications = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // First, get all projects for this business (updated to use project_id)
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
          .select('task_id, skills_required') // Changed from id to task_id
          .eq('project_id', project.project_id); // Changed from project.id to project.project_id

        if (tasksError) {
          console.error('Error fetching tasks for project:', project.project_id, tasksError);
          continue;
        }

        const taskIds = tasksData.map(task => task.task_id); // Changed from task.id to task.task_id

        if (taskIds.length === 0) {
          projectsWithApplications.push({
            ...project,
            applications: []
          });
          continue;
        }

        // Create a map of task IDs to their skills required
        const taskSkillsMap = new Map<string, string[]>();
        tasksData.forEach(task => {
          taskSkillsMap.set(task.task_id, task.skills_required || []); // Changed from task.id to task.task_id
        });

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
            .select('first_name, last_name, title, location, employment_preference, skills')
            .eq('id', app.user_id)
            .single();

          if (profileError) {
            console.error('Error fetching profile for user:', app.user_id, profileError);
            continue;
          }

          // Get task details
          const { data: taskData, error: taskError } = await supabase
            .from('project_sub_tasks')
            .select('title, description, skills_required')
            .eq('task_id', app.task_id) // Changed from 'id' to 'task_id'
            .single();

          if (taskError) {
            console.error('Error fetching task details:', taskError);
            continue;
          }

          // Parse user skills
          let userSkills: Skill[] = [];
          if (profileData.skills) {
            try {
              if (typeof profileData.skills === 'string') {
                // Try to parse if it's a JSON string
                const parsedSkills = JSON.parse(profileData.skills);
                if (Array.isArray(parsedSkills)) {
                  userSkills = parsedSkills.map(s => 
                    typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
                  );
                }
              } else if (Array.isArray(profileData.skills)) {
                // If it's already an array
                userSkills = profileData.skills.map(s => 
                  typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
                );
              }
            } catch (e) {
              console.error("Error parsing skills:", e);
            }
          }

          // Calculate skill match
          const userSkillNames = userSkills.map(s => s.skill.toLowerCase());
          const taskRequiredSkills = taskData.skills_required || [];
          
          let matchedSkills = 0;
          taskRequiredSkills.forEach(skill => {
            if (userSkillNames.includes(skill.toLowerCase())) {
              matchedSkills++;
            }
          });
          
          const skillMatch = taskRequiredSkills.length > 0 
            ? Math.round((matchedSkills / taskRequiredSkills.length) * 100) 
            : 0;

          applicationsWithProfiles.push({
            ...app,
            profile: {
              ...profileData,
              skills: userSkills
            },
            business_roles: {
              ...taskData,
              project: {
                title: project.title
              }
            },
            skillMatch
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
        .eq('job_app_id', applicationId); // Changed from 'id' to 'job_app_id'
      
      if (error) throw error;
      
      // Update local state
      setProjects(projects.map(project => ({
        ...project,
        applications: project.applications.map(app => 
          app.job_app_id === applicationId ? { ...app, status: newStatus } : app // Changed from app.id to app.job_app_id
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

  const toggleApplicationExpanded = (applicationId: string) => {
    setExpandedApplications(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(applicationId)) {
        newExpanded.delete(applicationId);
      } else {
        newExpanded.add(applicationId);
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
                key={project.project_id} // Changed from project.id to project.project_id
                open={expandedProjects.has(project.project_id)} // Changed from project.id to project.project_id
                onOpenChange={() => toggleProjectExpanded(project.project_id)} // Changed from project.id to project.project_id
                className="border rounded-lg overflow-hidden"
              >
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 text-left hover:bg-muted/50">
                  <div>
                    <h3 className="text-lg font-medium">{project.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {project.applications.length} application{project.applications.length !== 1 ? 's' : ''}
                      </Badge>
                      {project.skills_required && project.skills_required.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {project.skills_required.slice(0, 3).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {project.skills_required.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{project.skills_required.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {expandedProjects.has(project.project_id) ? // Changed from project.id to project.project_id
                    <ChevronDown className="h-5 w-5 flex-shrink-0" /> : 
                    <ChevronRight className="h-5 w-5 flex-shrink-0" />
                  }
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  {project.applications.length === 0 ? (
                    <p className="text-muted-foreground text-center p-4">No applications for this project.</p>
                  ) : (
                    <div className="space-y-2">
                      {project.applications.map(application => (
                        <Collapsible
                          key={application.job_app_id} // Changed from application.id to application.job_app_id
                          open={expandedApplications.has(application.job_app_id)} // Changed from application.id to application.job_app_id
                          onOpenChange={() => toggleApplicationExpanded(application.job_app_id)} // Changed from application.id to application.job_app_id
                          className="border rounded-lg overflow-hidden"
                        >
                          <CollapsibleTrigger className="flex justify-between items-center w-full p-3 text-left hover:bg-muted/50">
                            <div className="grid grid-cols-6 flex-1 gap-2">
                              <div className="col-span-2">
                                <p className="font-medium">{application.profile?.first_name} {application.profile?.last_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{application.profile?.title}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm font-medium truncate">{application.business_roles?.title}</p>
                                <div className="flex items-center gap-1">
                                  <Badge variant={
                                    application.skillMatch && application.skillMatch > 70 ? "default" :
                                    application.skillMatch && application.skillMatch > 40 ? "secondary" : 
                                    "outline"
                                  }>
                                    {application.skillMatch || 0}% match
                                  </Badge>
                                </div>
                              </div>
                              <div className="col-span-2 flex items-center justify-end">
                                <select 
                                  className="px-2 py-1 border rounded text-xs"
                                  value={application.status}
                                  onChange={(e) => handleStatusChange(application.job_app_id, e.target.value)} // Changed from application.id to application.job_app_id
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in review">In Review</option>
                                  <option value="negotiation">Negotiation</option>
                                  <option value="accepted">Accepted</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </div>
                            </div>
                            {expandedApplications.has(application.job_app_id) ? // Changed from application.id to application.job_app_id 
                              <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" /> : 
                              <ChevronRight className="h-4 w-4 flex-shrink-0 ml-2" />
                            }
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-3">
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium">Application Message</p>
                                <p className="text-sm mt-1">{application.message}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium">Skills Match</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {application.business_roles?.skills_required?.map((skill, index) => {
                                    const hasSkill = application.profile?.skills?.some(
                                      s => s.skill.toLowerCase() === skill.toLowerCase()
                                    );
                                    return (
                                      <Badge key={index} variant={hasSkill ? "default" : "outline"} className="text-xs">
                                        {skill} {hasSkill && "✓"}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            
                              <div className="flex flex-wrap justify-between items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                  Applied {new Date(application.applied_at).toLocaleDateString()} • 
                                  {application.profile?.location && ` ${application.profile.location} • `}
                                  {application.profile?.employment_preference}
                                </p>
                                
                                {application.cv_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(application.cv_url!, '_blank')}
                                  >
                                    <FileText className="mr-1 h-4 w-4" />
                                    View CV
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
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
}
