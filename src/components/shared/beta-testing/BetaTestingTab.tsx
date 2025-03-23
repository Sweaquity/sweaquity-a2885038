import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KanbanBoard, BetaTicket } from "./KanbanBoard";
import { DragDropContext } from "react-beautiful-dnd";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Ticket, TicketStatistics, UserData } from "@/types/types";
import TicketStats from "@/components/ticket/TicketStats";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";

interface JobApplication {
  task_id?: string;
  project_id?: string;
  user_id: string;
}

interface ExtendedBetaTicket extends BetaTicket {
  task_id?: string;
  job_app_id?: string;
  expanded?: boolean;
  isTaskTicket?: boolean;
  job_applications?: JobApplication;
}

interface BetaTestingTabProps {
  userType: "job_seeker" | "business";
  userId?: string;
  includeProjectTickets?: boolean;
}

export const BetaTestingTab = ({ userType, userId, includeProjectTickets = false }: BetaTestingTabProps) => {
  const [tickets, setTickets] = useState<ExtendedBetaTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectTickets, setProjectTickets] = useState<ExtendedBetaTicket[]>([]);
  const [showKanban, setShowKanban] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const [ticketStatistics, setTicketStatistics] = useState({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0
  });
  const [dashboardKey, setDashboardKey] = useState(0);
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const createTicket = async () => {
    if (!userId) return;
    
    try {
      const { data: userData } = await supabase
        .from(userType === 'job_seeker' ? 'profiles' : 'businesses')
        .select('*')
        .eq('id', userId)
        .single();

      const typedUserData = userData as UserData;
      
      const userName = userType === 'job_seeker'
        ? `${typedUserData?.first_name || ''} ${typedUserData?.last_name || ''}`
        : typedUserData?.company_name || '';

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: `New feature request by ${userName}`,
          description: "I would like to request a new feature...",
          reporter: userId,
          status: 'new',
          priority: 'medium',
          health: 'green',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Test ticket created successfully!");
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create test ticket");
    }
  };

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      if (!userId) return;

      const { data: betaTickets, error: betaError } = await supabase
        .from('tickets')
        .select('*')
        .or(`reporter.eq.${userId},assigned_to.eq.${userId}`)
        .is('project_id', null);

      if (betaError) throw betaError;
      
      const updatedTickets = (betaTickets || []).map(ticket => ({
        ...ticket,
        expanded: expandedTickets[ticket.id] || false
      }));
      
      setTickets(updatedTickets as ExtendedBetaTicket[]);
      calculateTicketStatistics(updatedTickets as Ticket[]);

      if (includeProjectTickets) {
        await loadProjectTickets();
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [userId, expandedTickets, includeProjectTickets]);

  const calculateTicketStatistics = (ticketData: Ticket[]) => {
    const totalTickets = ticketData.length;
    const openTickets = ticketData.filter(ticket => 
      ticket.status !== 'done' && ticket.status !== 'closed'
    ).length;
    const closedTickets = totalTickets - openTickets;
    const highPriorityTickets = ticketData.filter(ticket => 
      ticket.priority === 'high'
    ).length;

    setTicketStatistics({
      totalTickets,
      openTickets,
      closedTickets,
      highPriorityTickets
    });
  };

  const loadProjectTickets = useCallback(async () => {
    try {
      if (!userId) return;

      let projectTicketsData: ExtendedBetaTicket[] = [];

      if (userType === 'job_seeker') {
        const { data: acceptedJobsData, error: acceptedJobsError } = await supabase
          .from('accepted_jobs')
          .select(`
            job_app_id,
            equity_agreed,
            job_applications!inner (
              task_id,
              project_id
            )
          `)
          .eq('job_applications.user_id', userId);

        if (acceptedJobsError) throw acceptedJobsError;
        
        if (acceptedJobsData && acceptedJobsData.length > 0) {
          const projectIds: string[] = [];
          const taskIds: string[] = [];
          
          acceptedJobsData.forEach(job => {
            if (job.job_applications && typeof job.job_applications === 'object') {
              const jobApp = job.job_applications as unknown as { project_id?: string; task_id?: string };
              if (jobApp.project_id) projectIds.push(jobApp.project_id);
              if (jobApp.task_id) taskIds.push(jobApp.task_id);
            }
          });
          
          if (projectIds.length > 0) {
            const { data: projectTickets, error: ticketsError } = await supabase
              .from('tickets')
              .select('*, job_applications(*)')
              .in('project_id', projectIds);

            if (ticketsError) throw ticketsError;
            
            if (taskIds.length > 0) {
              const { data: taskTickets, error: taskTicketsError } = await supabase
                .from('tickets')
                .select('*, job_applications(*)')
                .in('task_id', taskIds);
              
              if (taskTicketsError) throw taskTicketsError;
              
              const allTickets = [...(projectTickets || []), ...(taskTickets || [])];
              const uniqueTicketIds = new Set();
              const uniqueTickets = allTickets.filter(ticket => {
                if (uniqueTicketIds.has(ticket.id)) return false;
                uniqueTicketIds.add(ticket.id);
                return true;
              });
              
              projectTicketsData = uniqueTickets.map(ticket => ({
                ...ticket,
                expanded: expandedTickets[ticket.id] || false,
                isTaskTicket: Boolean(ticket.task_id)
              })) as ExtendedBetaTicket[];
            }
          }
        }
      } else if (userType === 'business') {
        const { data: businessProjects, error: projectsError } = await supabase
          .from('business_projects')
          .select('project_id')
          .eq('business_id', userId);

        if (projectsError) throw projectsError;

        if (businessProjects && businessProjects.length > 0) {
          const projectIds = businessProjects.map(p => p.project_id);
          
          const { data: projectTickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('*')
            .in('project_id', projectIds);

          if (ticketsError) throw ticketsError;
          
          projectTicketsData = (projectTickets || []).map(ticket => ({
            ...ticket,
            expanded: expandedTickets[ticket.id] || false
          })) as ExtendedBetaTicket[];
        }
      }

      setProjectTickets(projectTicketsData);
      
    } catch (error) {
      console.error('Error loading project tickets:', error);
      toast.error("Failed to load project tickets");
    }
  }, [userId, userType, expandedTickets]);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success("Ticket status updated");
      
      const ticketToUpdate = [...tickets, ...projectTickets].find(t => t.id === ticketId) as ExtendedBetaTicket;
      if (ticketToUpdate?.task_id && newStatus === 'done') {
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({ 
            task_status: 'pending_review',
            last_activity_at: new Date().toISOString()
          })
          .eq('task_id', ticketToUpdate.task_id);
        
        if (taskError) {
          console.error('Error updating task status:', taskError);
        } else {
          toast.success("Task marked for review by business");
        }
      }
      
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket status");
    }
  };

  const updateTicketDueDate = async (ticketId: string, newDueDate: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          due_date: newDueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success("Due date updated");
      loadTickets();
    } catch (error) {
      console.error('Error updating due date:', error);
      toast.error("Failed to update due date");
    }
  };

  const updateTicketPriority = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          priority: newPriority,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success("Priority updated");
      loadTickets();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error("Failed to update priority");
    }
  };

  const addTicketNote = async (ticketId: string, note: string) => {
    if (!userId || !note.trim()) return;
    
    try {
      const { data: ticketData, error: getError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', ticketId)
        .single();
      
      if (getError) throw getError;
      
      const currentNotes = ticketData.notes || [];
      
      const { data: userData, error: userError } = await supabase
        .from(userType === 'job_seeker' ? 'profiles' : 'businesses')
        .select(userType === 'job_seeker' ? 'first_name, last_name' : 'company_name')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      const typedUserData = userData as UserData;
      
      const userName = userType === 'job_seeker'
        ? `${typedUserData.first_name || ''} ${typedUserData.last_name || ''}`
        : typedUserData.company_name || '';
      
      const newNote = {
        id: crypto.randomUUID(),
        user: userName,
        timestamp: new Date().toISOString(),
        content: note
      };
      
      const updatedNotes = [...currentNotes, newNote];
      
      const { error } = await supabase
        .from('tickets')
        .update({ 
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      toast.success("Note added successfully");
      loadTickets();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error("Failed to add note");
    }
  };

  const updateProjectCompletion = async (ticketId: string, completionPercent: number) => {
    try {
      const ticket = [...tickets, ...projectTickets].find(t => t.id === ticketId) as ExtendedBetaTicket;
      if (!ticket || !ticket.task_id) {
        toast.error("This ticket is not associated with a task");
        return;
      }
      
      const { error: taskError } = await supabase
        .from('project_sub_tasks')
        .update({ 
          completion_percentage: completionPercent,
          last_activity_at: new Date().toISOString()
        })
        .eq('task_id', ticket.task_id);
      
      if (taskError) throw taskError;
      
      if (ticket.job_app_id) {
        const { data: acceptedJob, error: jobError } = await supabase
          .from('accepted_jobs')
          .select('equity_agreed')
          .eq('job_app_id', ticket.job_app_id)
          .maybeSingle();
        
        if (jobError) throw jobError;
        
        if (acceptedJob) {
          const equityPoints = (acceptedJob.equity_agreed * (completionPercent / 100)).toFixed(2);
          
          const { error: equityError } = await supabase
            .from('tickets')
            .update({ 
              equity_points: equityPoints,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          if (equityError) throw equityError;
        }
      }
      
      toast.success("Project completion updated");
      loadTickets();
    } catch (error) {
      console.error('Error updating project completion:', error);
      toast.error("Failed to update project completion");
    }
  };

  const handleRefresh = useCallback(() => {
    setDashboardKey(prevKey => prevKey + 1);
    loadTickets();
  }, [loadTickets]);

  const toggleShowDashboard = useCallback(() => {
    setShowDashboard(!showDashboard);
    setDashboardKey(prevKey => prevKey + 1);
  }, [showDashboard]);

  const handleToggleTicket = useCallback((ticketId: string, isExpanded: boolean) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: isExpanded
    }));
    
    if (isExpanded) {
      setSelectedTicket(ticketId);
    } else if (selectedTicket === ticketId) {
      setSelectedTicket(null);
    }
  }, [selectedTicket]);

  const handleTicketAction = useCallback((ticketId: string, action: string, data: any) => {
    switch (action) {
      case 'updateStatus':
        updateTicketStatus(ticketId, data);
        break;
      case 'updateDueDate':
        updateTicketDueDate(ticketId, data);
        break;
      case 'updatePriority':
        updateTicketPriority(ticketId, data);
        break;
      case 'addNote':
        addTicketNote(ticketId, data);
        break;
      case 'updateCompletion':
        updateProjectCompletion(ticketId, data);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadTickets();
    }
  }, [userId, loadTickets]);

  const allTickets = [...tickets, ...projectTickets].map(ticket => ({
    ...ticket,
    expanded: expandedTickets[ticket.id] || false
  })) as Ticket[];

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Live Projects</CardTitle>
              <CardDescription>View and manage your project tasks</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowKanban(!showKanban)}
                size="sm"
              >
                {showKanban ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showKanban ? "Hide Kanban" : "Show Kanban"}
              </Button>
              <Button
                variant="outline" 
                onClick={toggleShowDashboard}
                size="sm"
              >
                {showDashboard ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showDashboard ? "Hide Dashboard" : "Show Dashboard"}
              </Button>
              <Button onClick={handleRefresh}>Refresh</Button>
              <Button onClick={createTicket}>Create Test Ticket</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              Loading tickets...
            </div>
          ) : allTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No tickets found.</p>
              <Button onClick={createTicket}>Create a test ticket</Button>
            </div>
          ) : (
            <>
              {!showDashboard ? (
                <>
                  <TicketStats
                    totalTickets={ticketStatistics.totalTickets}
                    openTickets={ticketStatistics.openTickets}
                    closedTickets={ticketStatistics.closedTickets}
                    highPriorityTickets={ticketStatistics.highPriorityTickets}
                  />
                  
                  {showKanban && (
                    <DragDropContext onDragEnd={(result) => {
                      if (!result.destination) return;
                      const { draggableId, destination } = result;
                      
                      updateTicketStatus(draggableId, destination.droppableId);
                    }}>
                      <KanbanBoard 
                        tickets={allTickets} 
                        onStatusChange={updateTicketStatus}
                        onTicketClick={() => {}}
                      />
                    </DragDropContext>
                  )}
                </>
              ) : (
                <TicketDashboard
                  key={dashboardKey}
                  initialTickets={allTickets}
                  onRefresh={handleRefresh}
                  onTicketExpand={handleToggleTicket}
                  onTicketAction={handleTicketAction}
                  showTimeTracking={userType === 'job_seeker'}
                  currentUserId={userId}
                />
              )}
              
              {userType === 'job_seeker' && selectedTicket && (
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Time Tracking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedTicket && userId && (
                        <TimeTracker 
                          ticketId={selectedTicket} 
                          userId={userId} 
                          jobAppId={(allTickets.find(t => t.id === selectedTicket) as ExtendedBetaTicket)?.job_app_id}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
