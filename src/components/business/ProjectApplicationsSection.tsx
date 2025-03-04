import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, FileText, Loader2, MessageCircle, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skill } from "@/types/jobSeeker";
import { useApplicationActions } from "@/components/job-seeker/dashboard/applications/hooks/useApplicationActions";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { RejectApplicationDialog } from "./applications/RejectApplicationDialog";

interface Application {
  job_app_id: string;
  task_id: string;
  user_id: string;
  applied_at: string;
  status: string;
  message: string;
  cv_url: string | null;
  skillMatch?: number;
  task_discourse?: string;
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
  const [newApplicationsCount, setNewApplicationsCount] = useState(0);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  
  const { isUpdatingStatus, updateApplicationStatus } = useApplicationActions(() => {
    loadProjectsWithApplications();
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
    if (newStatus === 'rejected') {
      setSelectedApplicationId(applicationId);
      setRejectDialogOpen(true);
      return;
    }
    
    await updateApplicationStatus(applicationId, newStatus);
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
    </Card>
  );
};

const PendingApplicationsTable = ({ 
  applications, 
  expandedApplications, 
  toggleApplicationExpanded, 
  handleStatusChange, 
  isUpdatingStatus 
}: { 
  applications: Application[], 
  expandedApplications: Set<string>, 
  toggleApplicationExpanded: (id: string) => void,
  handleStatusChange: (id: string, status: string) => void,
  isUpdatingStatus: string | null
}) => {
  return (
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
        {applications.map(application => (
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
      {applications.map(application => (
        <Collapsible
          key={`${application.job_app_id}-details`}
          open={expandedApplications.has(application.job_app_id)}
        >
          <CollapsibleContent className="p-4 border-t">
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
                          s => typeof s === 'object' && s !== null && 'skill' in s && 
                            typeof s.skill === 'string' && 
                            typeof skillReq.skill === 'string' &&
                            s.skill.toLowerCase() === skillReq.skill.toLowerCase()
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
    </Table>
  );
};

const ActiveApplicationsTable = ({ 
  applications, 
  expandedApplications, 
  toggleApplicationExpanded, 
  handleStatusChange, 
  isUpdatingStatus 
}: { 
  applications: Application[], 
  expandedApplications: Set<string>, 
  toggleApplicationExpanded: (id: string) => void,
  handleStatusChange: (id: string, status: string) => void,
  isUpdatingStatus: string | null
}) => {
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);

  const handleSendMessage = async (applicationId: string) => {
    if (!message.trim()) return;
    
    try {
      setSendingMessage(applicationId);
      const { data: application, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', applicationId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const timestamp = new Date().toLocaleString();
      const newMessage = `[${timestamp}] Business: ${message}`;
      
      const updatedDiscourse = application.task_discourse 
        ? `${application.task_discourse}\n\n${newMessage}`
        : newMessage;
        
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ task_discourse: updatedDiscourse })
        .eq('job_app_id', applicationId);
        
      if (updateError) throw updateError;
      
      setMessage("");
      toast.success("Message sent successfully");
      
      const { data: updatedApplication, error: refreshError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_app_id', applicationId)
        .single();
      
      if (!refreshError) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(null);
    }
  };

  return (
    <div className="space-y-4">
      {applications.map(application => (
        <Card key={application.job_app_id} className="shadow-sm hover:shadow transition-shadow">
          <Collapsible 
            open={expandedApplications.has(application.job_app_id)}
            onOpenChange={() => toggleApplicationExpanded(application.job_app_id)}
          >
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
              <div className="flex flex-1 flex-col space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-md font-semibold line-clamp-1">
                    {application.business_roles?.title || "Untitled Role"}
                  </h3>
                  <Badge className={
                    application.status.toLowerCase() === 'accepted' 
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }>
                    {application.status}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center">
                    {application.profile?.first_name} {application.profile?.last_name}
                  </span>
                  <span className="inline-flex items-center">
                    Project: {application.business_roles?.project.title || "Untitled Project"}
                  </span>
                  <span className="inline-flex items-center">
                    {application.business_roles?.equity_allocation && `${application.business_roles.equity_allocation}% equity`}
                  </span>
                </div>
              </div>
              
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {expandedApplications.has(application.job_app_id) ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            
            <CardContent className="px-4 py-2">
              <div className="grid grid-cols-1 gap-4 mb-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Skills Required</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {application.business_roles?.skill_requirements?.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-slate-50">
                        {typeof skill === 'string' ? skill : skill.skill}
                        {typeof skill !== 'string' && skill.level && 
                          <span className="ml-1 opacity-70">({skill.level})</span>
                        }
                      </Badge>
                    ))}
                    {(!application.business_roles?.skill_requirements || 
                      application.business_roles.skill_requirements.length === 0) && 
                      <span className="text-muted-foreground">No specific skills required</span>
                    }
                  </div>
                </div>
                
                <select 
                  className="w-full md:w-1/3 px-2 py-1 border rounded text-xs self-start"
                  value={application.status}
                  onChange={(e) => handleStatusChange(application.job_app_id, e.target.value)}
                  disabled={isUpdatingStatus === application.job_app_id}
                >
                  <option value="negotiation">Negotiation</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="in review">Return to In Review</option>
                </select>
              </div>
              
              <CollapsibleContent className="mt-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Application Message</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {application.message || "No application message provided."}
                  </p>
                </div>
                
                {application.task_discourse && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-md border">
                    <h4 className="font-medium mb-2">Message History</h4>
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {application.task_discourse}
                    </pre>
                  </div>
                )}
                
                <div className="mt-4 space-y-2">
                  <div className="flex flex-col space-y-2">
                    <h4 className="text-sm font-medium">Send Message</h4>
                    <textarea 
                      className="min-h-[100px] p-2 border rounded-md text-sm w-full"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm"
                        onClick={() => handleSendMessage(application.job_app_id)} 
                        disabled={!message.trim() || sendingMessage === application.job_app_id}
                      >
                        {sendingMessage === application.job_app_id ? (
                          <>
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="mr-1.5 h-
