
import ProjectsOverview from "@/components/job-seeker/ProjectsOverview";
import { DashboardContent } from "@/components/job-seeker/dashboard/DashboardContent";
import { EquityProject, JobApplication, Profile, Skill } from "@/types/jobSeeker";
import { CVFile } from "@/hooks/job-seeker/useCVData";
import { Notification, TicketMessage, Task, TaskType } from "@/types/dashboard";
import { useEffect, useState, useCallback } from "react";
import { useMessaging } from "@/components/job-seeker/dashboard/applications/hooks/useMessaging";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DragDropContext } from "react-beautiful-dnd";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FileText, Clock, CheckCircle, AlertTriangle, Info } from "lucide-react";
import React from "react";
import { useAcceptedJobsCore } from "@/hooks/jobs/useAcceptedJobsCore";

// Components imports for the ticket UI
import { KanbanBoard, BetaTicket } from "@/components/shared/beta-testing/KanbanBoard";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";
import { AdminTicketManager } from "@/components/admin/tickets/AdminTicketManager";
import { supabase } from "@/lib/supabase";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";

// Define ticket interface
interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  health: string;
  due_date?: string;
  assigned_to?: string;
  expanded?: boolean;
  task_id?: string;
  project_id?: string;
  description?: string;
  job_app_id?: string;
}

interface TicketStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  closed: number;
}

interface AcceptedJob {
  id: string;
  job_app_id: string;
  date_accepted: string;
  document_url: string | null;
  accepted_discourse: string | null;
  equity_agreed: number;
}

interface DashboardTabProps {
  activeTab: string;
  profile: Profile | null;
  cvUrl: string | null;
  parsedCvData: any;
  skills: Skill[] | null;
  applications: JobApplication[];
  equityProjects: EquityProject[];
  availableOpportunities: EquityProject[];
  handleSkillsUpdate: (skills: Skill[]) => Promise<void>;
  refreshApplications: () => void;
  onDocumentAction: (projectId: string, action: "edit" | "approve") => void;
  userCVs?: CVFile[];
  onCvListUpdated?: () => void;
}

export const DashboardTab = ({
  activeTab,
  profile,
  cvUrl,
  parsedCvData,
  skills,
  applications,
  equityProjects,
  availableOpportunities,
  handleSkillsUpdate,
  refreshApplications,
  onDocumentAction,
  userCVs,
  onCvListUpdated,
}: DashboardTabProps) => {
  const { conversations, loadConversations, unreadCount } = useMessaging();
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("kanban");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});
  const [betaTickets, setBetaTickets] = useState<BetaTicket[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<AcceptedJob[]>([]);
  const [denormalizedProjects, setDenormalizedProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const { getAcceptedJob } = useAcceptedJobsCore();
  const [ticketStats, setTicketStats] = useState<TicketStats>({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    closed: 0,
  });

  const loadUserTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assignedTickets, error: assignedError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', user.id);

      const { data: reportedTickets, error: reportedError } = await supabase
        .from('tickets')
        .select('*')
        .eq('reporter', user.id);

      if (assignedError) console.error("Error fetching assigned tickets:", assignedError);
      if (reportedError) console.error("Error fetching reported tickets:", reportedError);

      const allTickets = [...(assignedTickets || []), ...(reportedTickets || [])];
      const uniqueTickets = Array.from(new Map(allTickets.map(ticket => [ticket.id, ticket])).values());

      const { data: timeEntriesData, error: timeEntriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id);

      if (timeEntriesError) {
        console.error("Error fetching time entries:", timeEntriesError);
      } else {
        setTimeEntries(timeEntriesData || []);
      }

      const stats = {
        total: uniqueTickets.length,
        todo: uniqueTickets.filter(t => t.status === 'todo').length,
        inProgress: uniqueTickets.filter(t => t.status === 'in-progress').length,
        review: uniqueTickets.filter(t => t.status === 'review').length,
        done: uniqueTickets.filter(t => t.status === 'done').length,
        closed: uniqueTickets.filter(t => t.status === 'closed').length,
      };

      setTicketStats(stats);
      setUserTickets(uniqueTickets);
      setBetaTickets(uniqueTickets as BetaTicket[]);

      await loadTicketMessages(user.id, uniqueTickets.map(t => t.id));
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const loadAcceptedJobs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load accepted jobs from the normalized table
      const { data: acceptedJobsData, error: acceptedJobsError } = await supabase
        .from('accepted_jobs')
        .select(`
          *,
          job_applications!inner (
            job_app_id,
            user_id,
            project_id,
            task_id,
            status
          )
        `)
        .eq('job_applications.user_id', user.id);

      if (acceptedJobsError) {
        console.error("Error fetching accepted jobs:", acceptedJobsError);
      } else {
        setAcceptedJobs(acceptedJobsData || []);
      }

      // Load denormalized projects view
      const { data: denormalizedData, error: denormalizedError } = await supabase
        .from('jobseeker_active_projects')
        .select('*')
        .eq('user_id', user.id);

      if (denormalizedError) {
        console.error("Error fetching denormalized projects:", denormalizedError);
      } else {
        setDenormalizedProjects(denormalizedData || []);
      }
    } catch (error) {
      console.error("Error loading projects data:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const loadTicketMessages = async (userId: string, ticketIds: string[]) => {
    if (!ticketIds.length) return;
    
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('user_messages')
        .select('*')
        .eq('recipient_id', userId)
        .in('related_ticket', ticketIds);
      
      if (messagesError) {
        console.error("Error fetching ticket messages:", messagesError);
        return;
      }
      
      setTicketMessages(messages || []);
      
    } catch (error) {
      console.error("Error loading ticket messages:", error);
    }
  };

  useEffect(() => {
    loadUserTickets();
    loadAcceptedJobs();
  }, [loadUserTickets, loadAcceptedJobs]);

  useEffect(() => {
    if (loadConversations) {
      loadConversations();
    }
  }, [loadConversations]);

  useEffect(() => {
    const loadTimeEntriesForTickets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !userTickets.length) return;

        const ticketIds = userTickets.map(ticket => ticket.id);
        
        const { data: timeEntriesData, error: timeEntriesError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .in('ticket_id', ticketIds);

        if (timeEntriesError) {
          console.error("Error fetching time entries:", timeEntriesError);
        } else {
          setTimeEntries(timeEntriesData || []);
        }
      } catch (error) {
        console.error("Error loading time entries:", error);
      }
    };

    if (userTickets.length > 0) {
      loadTimeEntriesForTickets();
    }
  }, [userTickets]);

  const toggleTicketExpanded = (ticketId: string) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
    
    if (selectedTicketId === ticketId) {
      setSelectedTicketId(null);
    } else {
      setSelectedTicketId(ticketId);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (action === 'update_status') {
        const { error } = await supabase
          .from('tickets')
          .update({ status: data.status })
          .eq('id', ticketId);

        if (error) throw error;
      } 
      else if (action === 'update_priority') {
        const { error } = await supabase
          .from('tickets')
          .update({ priority: data.priority })
          .eq('id', ticketId);

        if (error) throw error;
      }
      else if (action === 'set_due_date') {
        const { error } = await supabase
          .from('tickets')
          .update({ due_date: data.due_date })
          .eq('id', ticketId);

        if (error) throw error;
      }
      else if (action === 'add_note') {
        const { data: ticketData, error: getError } = await supabase
          .from('tickets')
          .select('notes')
          .eq('id', ticketId)
          .single();

        if (getError) throw getError;

        const notes = ticketData.notes || [];
        notes.push({
          text: data.note,
          added_by: user.id,
          added_at: new Date().toISOString()
        });

        const { error: updateError } = await supabase
          .from('tickets')
          .update({ notes })
          .eq('id', ticketId);

        if (updateError) throw updateError;
      }
      else if (action === 'reply') {
        const { error } = await supabase
          .from('user_messages')
          .insert({
            sender_id: user.id,
            recipient_id: data.recipientId,
            subject: data.subject || `Re: Ticket #${ticketId}`,
            message: data.message,
            related_ticket: ticketId,
            read: false,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }
      else if (action === 'update_task_progress') {
        const ticket = userTickets.find(t => t.id === ticketId);
        if (ticket && ticket.task_id) {
          const { error } = await supabase
            .from('project_sub_tasks')
            .update({ completion_percentage: data.completion_percentage })
            .eq('task_id', ticket.task_id);

          if (error) throw error;
        }
      }
      else if (action === 'log_time') {
        const { error } = await supabase
          .from('time_entries')
          .insert({
            ticket_id: ticketId,
            user_id: user.id,
            start_time: new Date().toISOString(),
            end_time: new Date(new Date().getTime() + data.hours * 60 * 60 * 1000).toISOString(),
            hours_logged: data.hours,
            description: data.description
          });

        if (error) throw error;
      }
      
      await loadUserTickets();
      await loadAcceptedJobs();
      
    } catch (error) {
      console.error(`Error handling ticket action ${action}:`, error);
    }
  };

  const getGanttTasks = (): Task[] => {
    return userTickets.map(ticket => ({
      id: ticket.id,
      name: ticket.title,
      start: new Date(new Date().setDate(new Date().getDate() - 3)),
      end: ticket.due_date ? new Date(ticket.due_date) : new Date(new Date().setDate(new Date().getDate() + 4)),
      progress: ticket.status === 'done' ? 100 :
               ticket.status === 'review' ? 75 :
               ticket.status === 'in-progress' ? 50 :
               ticket.status === 'blocked' ? 25 : 0,
      type: 'task' as TaskType,
      isDisabled: false
    }));
  };

  const calculateTotalHoursLogged = (ticketId: string) => {
    const entries = timeEntries.filter(entry => entry.ticket_id === ticketId);
    return entries.reduce((sum, entry) => sum + (entry.hours_logged || 0), 0);
  };

  const renderTicketStats = () => {
    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.total}</div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.todo}</div>
              <p className="text-sm text-muted-foreground">To Do</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.inProgress}</div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.review}</div>
              <p className="text-sm text-muted-foreground">In Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.done}</div>
              <p className="text-sm text-muted-foreground">Done</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.closed}</div>
              <p className="text-sm text-muted-foreground">Closed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAcceptedJobsTable = () => {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Normalized Data: Accepted Jobs
          </CardTitle>
          <CardDescription>
            Data from the normalized 'accepted_jobs' table (joined with job_applications)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {acceptedJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accepted jobs found in the normalized table.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium">ID</th>
                    <th className="text-left p-3 text-xs font-medium">Job Application ID</th>
                    <th className="text-left p-3 text-xs font-medium">Date Accepted</th>
                    <th className="text-left p-3 text-xs font-medium">Equity Agreed</th>
                    <th className="text-left p-3 text-xs font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedJobs.map((job) => (
                    <tr key={job.id} className="border-t">
                      <td className="p-3 text-sm">{job.id.substring(0, 8)}...</td>
                      <td className="p-3 text-sm">{job.job_app_id.substring(0, 8)}...</td>
                      <td className="p-3 text-sm">{new Date(job.date_accepted).toLocaleDateString()}</td>
                      <td className="p-3 text-sm">{job.equity_agreed}%</td>
                      <td className="p-3 text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Find corresponding ticket
                            const ticket = userTickets.find(t => t.job_app_id === job.job_app_id);
                            if (ticket) {
                              setSelectedTicketId(ticket.id);
                            }
                          }}
                        >
                          View Ticket
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDenormalizedProjectsTable = () => {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Denormalized Data: Jobseeker Active Projects
          </CardTitle>
          <CardDescription>
            Data from the denormalized 'jobseeker_active_projects' view
          </CardDescription>
        </CardHeader>
        <CardContent>
          {denormalizedProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active projects found in the denormalized view.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium">Project</th>
                    <th className="text-left p-3 text-xs font-medium">Task</th>
                    <th className="text-left p-3 text-xs font-medium">Status</th>
                    <th className="text-left p-3 text-xs font-medium">Equity</th>
                    <th className="text-left p-3 text-xs font-medium">Completion</th>
                    <th className="text-left p-3 text-xs font-medium">Hours Logged</th>
                    <th className="text-left p-3 text-xs font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {denormalizedProjects.map((project) => (
                    <tr key={project.job_app_id || project.ticket_id} className="border-t">
                      <td className="p-3 text-sm">{project.project_title || 'Unknown'}</td>
                      <td className="p-3 text-sm">{project.ticket_title || 'Unknown'}</td>
                      <td className="p-3 text-sm">
                        <Badge variant={
                          project.ticket_status === 'done' ? 'success' : 
                          project.ticket_status === 'in-progress' ? 'warning' : 'default'
                        }>
                          {project.ticket_status || project.application_status || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{project.equity_agreed || project.equity_points || 0}%</td>
                      <td className="p-3 text-sm">{project.project_completion || 0}%</td>
                      <td className="p-3 text-sm">{project.total_hours_logged || 0} hrs</td>
                      <td className="p-3 text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (project.ticket_id) {
                              setSelectedTicketId(project.ticket_id);
                            }
                          }}
                        >
                          View Ticket
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTicketManagementUI = () => {
    return (
      <div className="space-y-6">
        {renderTicketStats()}
        
        <Card>
          <CardHeader>
            <CardTitle>Project Tasks</CardTitle>
            <CardDescription>Track and manage your project tasks</CardDescription>
            <div className="flex gap-2 mt-2">
              <TabsList>
                <TabsTrigger
                  value="kanban"
                  className={selectedTab === 'kanban' ? 'bg-primary text-primary-foreground' : ''}
                  onClick={() => setSelectedTab('kanban')}
                >
                  Kanban
                </TabsTrigger>
                <TabsTrigger
                  value="gantt"
                  className={selectedTab === 'gantt' ? 'bg-primary text-primary-foreground' : ''}
                  onClick={() => setSelectedTab('gantt')}
                >
                  Gantt
                </TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadUserTickets();
                  loadAcceptedJobs();
                }}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className={selectedTab === 'kanban' ? 'block' : 'hidden'}>
                <DragDropContext onDragEnd={(result) => {
                  if (!result.destination) return;
                  const { draggableId, destination } = result;
                  
                  handleTicketAction(
                    draggableId,
                    'update_status',
                    { status: destination.droppableId }
                  );
                }}>
                  <KanbanBoard 
                    tickets={betaTickets} 
                    onStatusChange={(ticketId, newStatus) => 
                      handleTicketAction(ticketId, 'update_status', { status: newStatus })
                    }
                    onTicketClick={toggleTicketExpanded}
                  />
                </DragDropContext>
              </div>
              <div className={selectedTab === 'gantt' ? 'block' : 'hidden'}>
                <GanttChartView tasks={getGanttTasks()} />
              </div>
            </div>
          </CardContent>
        </Card>

        {renderAcceptedJobsTable()}
        {renderDenormalizedProjectsTable()}

        {selectedTicketId && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                {userTickets.find(t => t.id === selectedTicketId)?.title || 'Ticket Details'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTicketId(null)}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-8">
              <ExpandedTicketDetails
                ticket={userTickets.find(t => t.id === selectedTicketId) || null}
                messages={ticketMessages.filter(m => m.related_ticket === selectedTicketId)}
                onAction={handleTicketAction}
              />
              
              {selectedTicketId && (
                <div className="border rounded-md p-4 bg-card">
                  <h3 className="text-lg font-medium mb-4">Time Tracking</h3>
                  {profile && (
                    <TimeTracker 
                      ticketId={selectedTicketId}
                      userId={profile.id}
                      jobAppId={userTickets.find(t => t.id === selectedTicketId)?.job_app_id}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const dashboardData = {
    profile,
    cvUrl,
    parsedCvData,
    setCvUrl: () => {},
    setParsedCvData: () => {},
    skills,
    applications,
    availableOpportunities,
    equityProjects,
    handleSkillsUpdate,
    logEffort: { projectId: '', hours: 0, description: '' },
    onLogEffort: () => {},
    onLogEffortChange: () => {},
    userTickets,
    ticketMessages,
    onTicketAction: handleTicketAction,
    userCVs,
    onCvListUpdated
  };

  return (
    <>
      <div className="space-y-6">
        <ProjectsOverview 
          currentProjects={equityProjects}
          pastProjects={[]}
          onDocumentAction={onDocumentAction}
          userTickets={userTickets}
          onTicketAction={handleTicketAction}
          refreshTickets={loadUserTickets}
        />
      </div>

      {activeTab === 'tickets' && renderTicketManagementUI()}
      
      {activeTab === 'dashboard' && (
        <DashboardContent 
          activeTab={activeTab} 
          dashboardData={dashboardData}
          refreshApplications={refreshApplications}
        />
      )}
    </>
  );
};
