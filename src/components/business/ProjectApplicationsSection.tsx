import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skill } from "@/types/jobSeeker";
import { useApplicationActions } from "@/components/job-seeker/dashboard/applications/hooks/useApplicationActions";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface Application {
  job_app_id: string;
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
    skill_requirements?: { skill: string; level: string }[];
    equity_allocation?: number;
    timeframe?: string;
    project: {
      title: string;
    }
  };
}

interface Project {
  project_id: string;
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
  const { isUpdatingStatus, updateApplicationStatus } = useApplicationActions(() => {
    loadProjectsWithApplications();
  });

  useEffect(() => {
    loadProjectsWithApplications();
  }, []);

  const loadProjectsWithApplications = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log("Loading projects for business ID:", session.user.id);

      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('*')
        .eq('business_id', session.user.id);

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        throw projectsError;
      }

      console.log("Projects fetched:", projectsData?.length || 0);

      if (!projectsData || projectsData.length === 0) {
        setIsLoading(false);
        setProjects([]);
        return;
      }

      const projectsWithApplications: Project[] = [];

      for (const project of projectsData) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('task_id, skill_requirements, equity_allocation, timeframe')
          .eq('project_id', project.project_id);

        if (tasksError) {
          console.error('Error fetching tasks for project:', project.project_id, tasksError);
          continue;
        }

        console.log(`Fetched ${tasksData?.length || 0} tasks for project ${project.project_id}`);
        
        const taskIds = tasksData.map(task => task.task_id);

        if (taskIds.length === 0) {
          projectsWithApplications.push({
            ...project,
            applications: []
          });
          continue;
        }

        const taskSkillsMap = new Map<string, any>();
        tasksData.forEach(task => {
          taskSkillsMap.set(task.task_id, {
            skill_requirements: task.skill_requirements || [],
            equity_allocation: task.equity_allocation,
            timeframe: task.timeframe
          });
        });

        const { data: applicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*')
          .in('task_id', taskIds);

        if (applicationsError) {
          console.error('Error fetching applications:', applicationsError);
          continue;
        }

        console.log(`Fetched ${applicationsData?.length || 0} applications for project ${project.project_id}`);

        if (!applicationsData || applicationsData.length === 0) {
          projectsWithApplications.push({
            ...project,
            applications: []
          });
          continue;
        }

        const applicationsWithProfiles = [];

        for (const app of applicationsData) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, title, location, employment_preference, skills')
            .eq('id', app.user_id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile for user:', app.user_id, profileError);
            continue;
          }

          const { data: taskData, error: taskError } = await supabase
            .from('project_sub_tasks')
            .select('title, description, skills_required, skill_requirements, equity_allocation, timeframe')
            .eq('task_id', app.task_id)
            .maybeSingle();

          if (taskError) {
            console.error('Error fetching task details:', taskError);
            continue;
          }

          let userSkills: Skill[] = [];
          if (profileData?.skills) {
            try {
              if (typeof profileData.skills === 'string') {
                const parsedSkills = JSON.parse(profileData.skills);
                if (Array.isArray(parsedSkills)) {
                  userSkills = parsedSkills.map(s => 
                    typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
                  );
                }
              } else if (Array.isArray(profileData.skills)) {
                userSkills = profileData.skills.map(s => 
                  typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
                );
              }
            } catch (e) {
              console.error("Error parsing skills:", e);
            }
          }

          const userSkillNames = userSkills.map(s => s.skill.toLowerCase());
          const taskRequiredSkills = taskData?.skill_requirements || [];
          
          let matchedSkills = 0;
          if (Array.isArray(taskRequiredSkills)) {
            taskRequiredSkills.forEach(skillObj => {
              const skillName = typeof skillObj === 'string' ? 
                skillObj.toLowerCase() : 
                (skillObj.skill ? skillObj.skill.toLowerCase() : '');
                
              if (skillName && userSkillNames.includes(skillName)) {
                matchedSkills++;
              }
            });
          }
          
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
              ...(taskData || {}),
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

      console.log("Final projects with applications:", projectsWithApplications.length);
      setProjects(projectsWithApplications);
    } catch (error) {
      console.error('Error loading projects with applications:', error);
      toast.error("Failed to load applications data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    await updateApplicationStatus(applicationId, newStatus);
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
                key={project.project_id}
                open={expandedProjects.has(project.project_id)}
                onOpenChange={() => toggleProjectExpanded(project.project_id)}
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
                  {expandedProjects.has(project.project_id) ? 
                    <ChevronDown className="h-5 w-5 flex-shrink-0" /> : 
                    <ChevronRight className="h-5 w-5 flex-shrink-0" />
                  }
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  {project.applications.length === 0 ? (
                    <p className="text-muted-foreground text-center p-4">No applications for this project.</p>
                  ) : (
                    <div className="space-y-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Applicant</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-center">Skills Match</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {project.applications.map(application => (
                            <TableRow 
                              key={application.job_app_id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleApplicationExpanded(application.job_app_id)}
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium">{application.profile?.first_name} {application.profile?.last_name}</p>
                                  <p className="text-xs text-muted-foreground">{application.profile?.title || "No title"}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{application.business_roles?.title || "Untitled"}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {application.business_roles?.timeframe && `${application.business_roles.timeframe} • `}
                                    {application.business_roles?.equity_allocation && `${application.business_roles.equity_allocation}% equity`}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={
                                  application.skillMatch && application.skillMatch > 70 ? "default" :
                                  application.skillMatch && application.skillMatch > 40 ? "secondary" : 
                                  "outline"
                                }>
                                  {application.skillMatch || 0}% match
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <select 
                                  className="w-full px-2 py-1 border rounded text-xs"
                                  value={application.status}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(application.job_app_id, e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={isUpdatingStatus === application.job_app_id}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in review">In Review</option>
                                  <option value="negotiation">Negotiation</option>
                                  <option value="accepted">Accepted</option>
                                  <option value="rejected">Rejected</option>
                                  <option value="withdrawn">Withdrawn</option>
                                </select>
                                {isUpdatingStatus === application.job_app_id && (
                                  <Loader2 className="animate-spin ml-2 h-4 w-4" />
                                )}
                              </TableCell>
                              <TableCell>
                                {expandedApplications.has(application.job_app_id) ? 
                                  <ChevronDown className="h-4 w-4 mx-auto" /> : 
                                  <ChevronRight className="h-4 w-4 mx-auto" />
                                }
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {project.applications.map(application => (
                        <Collapsible
                          key={`${application.job_app_id}-details`}
                          open={expandedApplications.has(application.job_app_id)}
                          className="border rounded-lg overflow-hidden mt-2"
                        >
                          <CollapsibleContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Application Details</h4>
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm font-medium">Message</p>
                                    <p className="text-sm">{application.message || "No message provided"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Applied</p>
                                    <p className="text-sm">{new Date(application.applied_at).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Location</p>
                                    <p className="text-sm">{application.profile?.location || "Not specified"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Preference</p>
                                    <p className="text-sm">{application.profile?.employment_preference || "Not specified"}</p>
                                  </div>
                                  {application.cv_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(application.cv_url!, '_blank');
                                      }}
                                    >
                                      <FileText className="mr-1 h-4 w-4" />
                                      View CV
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Skills Match</h4>
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm font-medium">Required Skills</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {application.business_roles?.skill_requirements?.map((skillReq, index) => {
                                        const hasSkill = application.profile?.skills?.some(
                                          s => s.skill.toLowerCase() === skillReq.skill.toLowerCase()
                                        );
                                        return (
                                          <Badge key={index} variant={hasSkill ? "default" : "outline"} className="text-xs">
                                            {skillReq.skill} ({skillReq.level}) {hasSkill && "✓"}
                                          </Badge>
                                        );
                                      })}
                                      
                                      {(!application.business_roles?.skill_requirements || application.business_roles.skill_requirements.length === 0) && 
                                        <p className="text-xs text-muted-foreground">No skill requirements specified</p>
                                      }
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm font-medium">Description</p>
                                    <p className="text-sm mt-1">{application.business_roles?.description || "No description provided"}</p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm font-medium">Timeframe</p>
                                    <p className="text-sm">{application.business_roles?.timeframe || "Not specified"}</p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm font-medium">Equity Allocation</p>
                                    <p className="text-sm">{application.business_roles?.equity_allocation ? `${application.business_roles.equity_allocation}%` : "Not specified"}</p>
                                  </div>
                                </div>
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
