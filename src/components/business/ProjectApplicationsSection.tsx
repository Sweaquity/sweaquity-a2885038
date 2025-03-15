import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobApplication } from "@/types/jobSeeker";
import { useApplicationActions } from "@/components/job-seeker/dashboard/applications/hooks/useApplicationActions";
import { RejectApplicationDialog } from "./applications/RejectApplicationDialog";
import { AcceptJobDialog } from "./applications/AcceptJobDialog";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { PendingApplicationsTable } from "./applications/tables/PendingApplicationsTable";
import { ActiveApplicationsTable } from "./applications/tables/ActiveApplicationsTable";
import { WithdrawnApplicationsTable } from "./applications/tables/WithdrawnApplicationsTable";
import { RejectedApplicationsTable } from "./applications/tables/RejectedApplicationsTable";
import { Application, Project } from "@/types/business";

export const ProjectApplicationsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());
  const [newApplicationsCount, setNewApplicationsCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [acceptJobDialogOpen, setAcceptJobDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const { isUpdatingStatus, updateApplicationStatus } = useApplicationActions(() => {
    loadProjectsWithApplications();
  });
  const { acceptJobAsBusiness, isLoading: isAcceptingJobLoading } = useAcceptedJobs(() => {
    window.location.reload();
  });

  useEffect(() => {
    loadProjectsWithApplications();
    setupRealtimeListener();
    return () => {
      cleanupRealtimeListener();
    };
  }, []);

  const setupRealtimeListener = () => {
    const channel = supabase
      .channel('application-updates')
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
          loadProjectsWithApplications();
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
          loadProjectsWithApplications();
        }
      )
      .subscribe();

    return channel;
  };

  const cleanupRealtimeListener = () => {
    supabase.removeChannel(supabase.channel('application-updates'));
  };

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

          let userSkills = [];
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
      
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      let newApps = 0;
      let newMsgs = 0;
      
      projectsWithApplications.forEach(project => {
        project.applications.forEach(app => {
          const appDate = new Date(app.applied_at);
          if (appDate > oneDayAgo && app.status === 'pending') {
            newApps++;
          }
          
          if (app.task_discourse) {
            const lastMessageMatch = app.task_discourse.match(/\[([^\]]+)\]/);
            if (lastMessageMatch) {
              try {
                const msgDate = new Date(lastMessageMatch[1]);
                if (msgDate > oneDayAgo) {
                  newMsgs++;
                }
              } catch (e) {
                console.error("Error parsing message date:", e);
              }
            }
          }
        });
      });
      
      setNewApplicationsCount(newApps);
      setNewMessagesCount(newMsgs);
    } catch (error) {
      console.error('Error loading projects with applications:', error);
      toast.error("Failed to load applications data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    const application = findApplicationById(applicationId);
    
    if (application && (application.accepted_business || application.accepted_jobseeker)) {
      toast.error("Cannot change status after acceptance. Use contract management instead.");
      return;
    }
    
    if (newStatus === 'rejected') {
      setSelectedApplicationId(applicationId);
      setRejectDialogOpen(true);
      return;
    }
    
    await updateApplicationStatus(applicationId, newStatus);
  };

  const findApplicationById = (applicationId: string): Application | undefined => {
    for (const project of projects) {
      const app = project.applications.find(app => app.job_app_id === applicationId);
      if (app) return app;
    }
    return undefined;
  };

  const handleRejectWithNote = async (applicationId: string, note: string) => {
    try {
      const { data: application, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', applicationId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const timestamp = new Date().toLocaleString();
      const rejectMessage = `[${timestamp}] Business: ${note} (Rejection reason)`;
      
      const updatedDiscourse = application.task_discourse 
        ? `${application.task_discourse}\n\n${rejectMessage}`
        : rejectMessage;
        
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ 
          status: 'rejected',
          task_discourse: updatedDiscourse
        })
        .eq('job_app_id', applicationId);
        
      if (updateError) throw updateError;
      
      toast.success("Application rejected with note");
      loadProjectsWithApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error("Failed to reject application");
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
        newExpanded.clear();
        newExpanded.add(applicationId);
      }
      return newExpanded;
    });
  };

  const handleAcceptJob = async (application: JobApplication) => {
    try {
      await acceptJobAsBusiness(application);
      toast.success("Job accepted successfully");
      loadProjectsWithApplications();
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error("Failed to accept job");
    } finally {
    }
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

  const getPendingApplications = () => {
    const pendingApps: Application[] = [];
    projects.forEach(project => {
      project.applications.forEach(app => {
        if (['pending', 'in review'].includes(app.status.toLowerCase())) {
          pendingApps.push(app);
        }
      });
    });
    return pendingApps;
  };

  const getActiveApplications = () => {
    const activeApps: Application[] = [];
    projects.forEach(project => {
      project.applications.forEach(app => {
        if (['negotiation', 'accepted'].includes(app.status.toLowerCase())) {
          activeApps.push(app);
        }
      });
    });
    return activeApps;
  };

  const getWithdrawnApplications = () => {
    const withdrawnApps: Application[] = [];
    projects.forEach(project => {
      project.applications.forEach(app => {
        if (app.status.toLowerCase() === 'withdrawn') {
          withdrawnApps.push(app);
        }
      });
    });
    return withdrawnApps;
  };

  const getRejectedApplications = () => {
    const rejectedApps: Application[] = [];
    projects.forEach(project => {
      project.applications.forEach(app => {
        if (app.status.toLowerCase() === 'rejected') {
          rejectedApps.push(app);
        }
      });
    });
    return rejectedApps;
  };

  const pendingApplications = getPendingApplications();
  const activeApplications = getActiveApplications();
  const withdrawnApplications = getWithdrawnApplications();
  const rejectedApplications = getRejectedApplications();

  const openAcceptJobDialog = async (application: Application) => {
    const jobApp: JobApplication = {
      job_app_id: application.job_app_id,
      role_id: application.role_id || "",
      task_id: application.task_id,
      project_id: application.project_id,
      status: application.status,
      applied_at: application.applied_at,
      notes: application.notes || "",
      message: application.message || "",
      cv_url: application.cv_url,
      task_discourse: application.task_discourse,
      id: application.job_app_id,
      accepted_jobseeker: application.accepted_jobseeker || false,
      accepted_business: application.accepted_business || false,
      business_roles: {
        title: application.business_roles?.title || "",
        description: application.business_roles?.description || "",
        project_title: application.business_roles?.project?.title,
        timeframe: application.business_roles?.timeframe,
        skill_requirements: application.business_roles?.skill_requirements?.map(req => {
          if (typeof req === 'string') {
            return req;
          }
          return {
            skill: req.skill,
            level: req.level as 'Beginner' | 'Intermediate' | 'Expert'
          };
        }) || [],
        equity_allocation: application.business_roles?.equity_allocation
      }
    };
    
    setSelectedApplication(jobApp);
    setAcceptJobDialogOpen(true);
    return Promise.resolve();
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Project Applications</h2>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-center p-4">No projects found.</p>
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-2">
              <TabsTrigger value="pending" className="relative">
                Pending Applications ({pendingApplications.length})
                {newApplicationsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 rounded-full">
                    {newApplicationsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="relative">
                Active Projects ({activeApplications.length})
                {newMessagesCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 rounded-full">
                    {newMessagesCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="withdrawn">
                Withdrawn ({withdrawnApplications.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedApplications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingApplications.length === 0 ? (
                <p className="text-muted-foreground text-center p-4">No pending applications found.</p>
              ) : (
                <PendingApplicationsTable 
                  applications={pendingApplications}
                  expandedApplications={expandedApplications}
                  toggleApplicationExpanded={toggleApplicationExpanded}
                  handleStatusChange={handleStatusChange}
                  isUpdatingStatus={isUpdatingStatus}
                />
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeApplications.length === 0 ? (
                <p className="text-muted-foreground text-center p-4">No active projects found.</p>
              ) : (
                <ActiveApplicationsTable 
                  applications={activeApplications}
                  expandedApplications={expandedApplications}
                  toggleApplicationExpanded={toggleApplicationExpanded}
                  handleStatusChange={handleStatusChange}
                  isUpdatingStatus={isUpdatingStatus}
                  onApplicationUpdate={() => loadProjectsWithApplications()}
                  openAcceptJobDialog={openAcceptJobDialog}
                  handleAcceptJob={handleAcceptJob}
                  isAcceptingJobLoading={isAcceptingJobLoading}
                />
              )}
            </TabsContent>

            <TabsContent value="withdrawn" className="space-y-4">
              {withdrawnApplications.length === 0 ? (
                <p className="text-muted-foreground text-center p-4">No withdrawn applications found.</p>
              ) : (
                <WithdrawnApplicationsTable 
                  applications={withdrawnApplications}
                  expandedApplications={expandedApplications}
                  toggleApplicationExpanded={toggleApplicationExpanded}
                  handleStatusChange={handleStatusChange}
                  isUpdatingStatus={isUpdatingStatus}
                />
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedApplications.length === 0 ? (
                <p className="text-muted-foreground text-center p-4">No rejected applications found.</p>
              ) : (
                <RejectedApplicationsTable 
                  applications={rejectedApplications}
                  expandedApplications={expandedApplications}
                  toggleApplicationExpanded={toggleApplicationExpanded}
                  handleStatusChange={handleStatusChange}
                  isUpdatingStatus={isUpdatingStatus}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <RejectApplicationDialog
        isOpen={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onReject={(note) => {
          if (selectedApplicationId) {
            handleRejectWithNote(selectedApplicationId, note);
          }
        }}
      />
      
      <AcceptJobDialog
        isOpen={acceptJobDialogOpen}
        onOpenChange={setAcceptJobDialogOpen}
        application={selectedApplication}
        onAccept={handleAcceptJob}
        isLoading={isAcceptingJobLoading}
      />
    </Card>
  );
};
