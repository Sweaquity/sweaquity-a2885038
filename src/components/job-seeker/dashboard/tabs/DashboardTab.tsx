
import { ProjectsOverview } from "@/components/job-seeker/ProjectsOverview";
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
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import React from "react";

// Components imports for the ticket UI
import { KanbanBoard, BetaTicket } from "@/components/shared/beta-testing/KanbanBoard";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";
import { AdminTicketManager } from "@/components/admin/tickets/AdminTicketManager";
import { supabase } from "@/lib/supabase";

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
}

interface TicketStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  closed: number;
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
  const [betaTickets, setBetaTickets] = useState<Ticket[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [ticketStats, setTicketStats] = useState<TicketStats>({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    closed: 0,
  });

  // Fix for infinite render - memoize loadUserTickets function with useCallback
  const loadUserTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load tickets where the user is assigned or is the reporter
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

      // Combine and deduplicate tickets
      const allTickets = [...(assignedTickets || []), ...(reportedTickets || [])];
      const uniqueTickets = Array.from(new Map(allTickets.map(ticket => [ticket.id, ticket])).values());

      // Load time entries for calculating hours logged
      const { data: timeEntriesData, error: timeEntriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id);

      if (timeEntriesError) {
        console.error("Error fetching time entries:", timeEntriesError);
      } else {
        setTimeEntries(timeEntriesData || []);
      }

      // Calculate ticket stats
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
      setBetaTickets(uniqueTickets);

      // Load ticket messages
      await loadTicketMessages(user.id, uniqueTickets.map(t => t.id));
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setTicketsLoading(false);
    }
  }, []); // Empty dependency array as this doesn't depend on props/state

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

  // Fix for infinite render - use loadUserTickets in useEffect with proper dependencies
  useEffect(() => {
    loadUserTickets();
  }, [loadUserTickets]); // Only depends on the memoized function

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load time entries whenever tickets change
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
            createdAt: new Date().toISOString()
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
      
      // Refresh tickets after any action
      await loadUserTickets();
      
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

  // Render functions
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
                    tickets={betaTickets as BetaTicket[]} 
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
            <CardContent>
              <ExpandedTicketDetails
                ticket={userTickets.find(t => t.id === selectedTicketId) || null}
                messages={ticketMessages.filter(m => m.related_ticket === selectedTicketId)}
                hoursLogged={calculateTotalHoursLogged(selectedTicketId)}
                onAction={handleTicketAction}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Now let's update the types for the dashboard content
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
      {/* Active Projects Section */}
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

      {/* Ticket Management UI */}
      {activeTab === 'tickets' && renderTicketManagementUI()}
      
      {/* Dashboard Content */}
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
