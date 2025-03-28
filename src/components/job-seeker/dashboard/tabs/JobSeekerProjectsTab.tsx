
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectTicketFilters } from "./components/ProjectTicketFilters";
import { ProjectStatsSummary } from "./components/ProjectStatsSummary";
import { ProjectTicketTabs } from "./components/ProjectTicketTabs";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { TaskCompletionReview } from "./TaskCompletionReview";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Ticket } from "@/types/types";
import { useSearchParams } from "react-router-dom";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
  const [activeTab, setActiveTab] = useState("all-tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [taskStats, setTaskStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0
  });
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [reviewTask, setReviewTask] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const projectFromUrl = searchParams.get('project');
  const taskFromUrl = searchParams.get('task');

  useEffect(() => {
    if (userId) {
      loadProjectsData();
      loadTicketsData();
    }
  }, [userId]);
  
  useEffect(() => {
    if (userId) {
      loadTicketsData();
    }
  }, [userId, selectedProject]);

  useEffect(() => {
    if (projectFromUrl) {
      setSelectedProject(projectFromUrl);
    }
  }, [projectFromUrl]);

  const loadProjectsData = async () => {
    try {
      // Only load projects where the user is assigned and equity is not fully allocated
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          job_app_id,
          project_id,
          accepted_jobs (
            equity_agreed,
            jobs_equity_allocated
          )
        `)
        .eq('user_id', userId)
        .eq('accepted_business', true)
        .eq('accepted_jobseeker', true);

      if (applicationsError) {
        throw applicationsError;
      }

      // Filter applications where equity is not fully allocated
      const nonFullyAllocatedApplications = applicationsData.filter(app => 
        app.accepted_jobs && 
        app.accepted_jobs.equity_agreed > 0 &&
        app.accepted_jobs.equity_agreed > app.accepted_jobs.jobs_equity_allocated
      );

      if (nonFullyAllocatedApplications.length === 0) {
        setProjects([]);
        setTickets([]);
        setLoading(false);
        return;
      }

      const projectIds = nonFullyAllocatedApplications.map(app => app.project_id);

      // Fetch project details
      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('*')
        .in('project_id', projectIds);

      if (projectsError) {
        throw projectsError;
      }

      setProjects(projectsData || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const loadTicketsData = async () => {
    try {
      setLoading(true);
      
      // Fetch tickets based on project selection
      let query = supabase
        .from('tickets')
        .select(`
          *,
          project_sub_tasks!inner (
            *
          ),
          job_applications!inner (
            *,
            accepted_jobs (*)
          )
        `)
        .eq('job_applications.user_id', userId);

      // Add project filter if needed
      if (selectedProject !== "all") {
        query = query.eq('project_id', selectedProject);
      }

      const { data: ticketsData, error: ticketsError } = await query;

      if (ticketsError) {
        throw ticketsError;
      }

      // Filter tickets where equity is not fully allocated
      const nonFullyAllocatedTickets = ticketsData.filter(ticket => {
        const jobApp = ticket.job_applications?.[0];
        return jobApp?.accepted_jobs && 
               jobApp.accepted_jobs.equity_agreed > 0 &&
               jobApp.accepted_jobs.equity_agreed > jobApp.accepted_jobs.jobs_equity_allocated;
      });

      // If a specific task is selected in the URL, make sure it's included even if fully allocated
      let processedTickets = nonFullyAllocatedTickets;
      if (taskFromUrl && !processedTickets.some(t => t.task_id === taskFromUrl)) {
        const { data: specificTask, error: specificTaskError } = await supabase
          .from('tickets')
          .select(`
            *,
            project_sub_tasks!inner (
              *
            ),
            job_applications!inner (
              *,
              accepted_jobs (*)
            )
          `)
          .eq('task_id', taskFromUrl)
          .eq('job_applications.user_id', userId)
          .maybeSingle();

        if (!specificTaskError && specificTask) {
          processedTickets = [...processedTickets, specificTask];
        }
      }

      // Map to tickets format
      const formattedTickets = processedTickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description || "",
        status: ticket.status,
        priority: ticket.priority,
        health: ticket.health,
        assigned_to: ticket.assigned_to,
        created_by: ticket.created_by || "",
        created_at: ticket.created_at || "",
        project_id: ticket.project_id,
        due_date: ticket.due_date,
        ticket_type: ticket.ticket_type,
        task_id: ticket.task_id,
        completion_percentage: ticket.completion_percentage,
        estimated_hours: ticket.estimated_hours,
        hours_logged: ticket.hours_logged,
        updated_at: ticket.updated_at,
        notes: ticket.notes,
        equity_points: ticket.equity_points
      }));

      setTickets(formattedTickets);
      
      const stats = {
        total: formattedTickets.length,
        open: formattedTickets.filter(t => t.status !== 'done' && t.status !== 'closed').length,
        closed: formattedTickets.filter(t => t.status === 'done' || t.status === 'closed').length,
        highPriority: formattedTickets.filter(t => t.priority === 'high').length
      };
      
      setTaskStats(stats);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      if (action === 'reviewCompletion') {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
          setReviewTask(ticket);
          setIsReviewOpen(true);
        }
        return;
      }
      
      if (action === 'logTime') {
        handleLogTime(ticketId);
        return;
      }
      
      if (action === 'updateStatus') {
        const { data: updateResult, error: updateError } = await supabase
          .from('tickets')
          .update({ 
            status: data.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);
          
        if (updateError) throw updateError;
        
        toast.success("Ticket status updated");
        loadTicketsData();
        return;
      }
      
      if (action === 'updateCompletion') {
        const { data: updateResult, error: updateError } = await supabase
          .from('tickets')
          .update({ 
            completion_percentage: data.percentage,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);
          
        if (updateError) throw updateError;
        
        // Also update the task completion in project_sub_tasks
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket && ticket.task_id) {
          const { error: taskUpdateError } = await supabase.rpc('update_active_project', {
            p_task_id: ticket.task_id,
            p_completion_percentage: data.percentage
          });
          
          if (taskUpdateError) throw taskUpdateError;
        }
        
        toast.success("Progress updated");
        loadTicketsData();
        return;
      }
    } catch (error) {
      console.error("Error performing ticket action:", error);
      toast.error("Failed to update ticket");
    }
  };

  const handleLogTime = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    // Here you would open a dialog to log time
    // For now let's just log a placeholder message
    toast.info("Time logging feature will be implemented here");
  };

  const handleRefresh = () => {
    loadTicketsData();
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleCreateTicket = () => {
    setIsCreateTicketDialogOpen(true);
  };

  const handleTicketCreated = async (ticketData: any) => {
    try {
      // Create a new ticket
      const { data: newTicket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: ticketData.title,
          description: ticketData.description,
          status: 'open',
          priority: ticketData.priority || 'medium',
          health: 'normal',
          project_id: ticketData.project_id,
          created_by: userId
        })
        .select()
        .single();
        
      if (ticketError) throw ticketError;
      
      toast.success("Ticket created successfully");
      setIsCreateTicketDialogOpen(false);
      loadTicketsData();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  const toggleKanbanView = () => {
    setShowKanban(!showKanban);
    if (showKanban) {
      setShowGantt(false);
    }
  };

  const toggleGanttView = () => {
    setShowGantt(!showGantt);
    if (showGantt) {
      setShowKanban(false);
    }
  };

  const handleReviewClose = () => {
    setIsReviewOpen(false);
    setReviewTask(null);
    loadTicketsData();
  };

  const renderTicketActions = (ticket: Ticket) => {
    if ((ticket.status === 'review' || ticket.status === 'in review') && 
        (ticket.completion_percentage === 100)) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleTicketAction(ticket.id, 'reviewCompletion', null)}
        >
          Review
        </Button>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No Active Projects</h3>
              <p className="text-muted-foreground">
                You don't have any active equity projects where you can still earn equity.
              </p>
              <p className="text-muted-foreground mt-2">
                Check the Equity tab in Applications to see your completed equity projects.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">Live Projects</h2>
        <p className="text-muted-foreground">Active equity projects where you can still earn equity</p>
      </div>

      <ProjectTicketFilters 
        projects={projects}
        selectedProject={selectedProject}
        showKanban={showKanban}
        showGantt={showGantt}
        onProjectChange={handleProjectChange}
        onToggleKanban={toggleKanbanView}
        onToggleGantt={toggleGanttView}
        onRefresh={handleRefresh}
        onCreateTicket={handleCreateTicket}
      />

      <ProjectStatsSummary 
        total={taskStats.total}
        open={taskStats.open}
        closed={taskStats.closed}
        highPriority={taskStats.highPriority}
      />
      
      <ProjectTicketTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tickets={tickets}
        showKanban={showKanban}
        showGantt={showGantt}
        onRefresh={handleRefresh}
        onTicketAction={handleTicketAction}
        onLogTime={handleLogTime}
        renderTicketActions={renderTicketActions}
        showTimeTracking={true}
        userId={userId || ''}
        userCanEditDates={true}
        userCanEditStatus={true}
      />

      <CreateTicketDialog
        open={isCreateTicketDialogOpen}
        onClose={() => setIsCreateTicketDialogOpen(false)}
        onCreateTicket={handleTicketCreated}
        projects={projects}
      />

      {reviewTask && (
        <TaskCompletionReview
          task={reviewTask}
          open={isReviewOpen}
          setOpen={setIsReviewOpen}
          onClose={handleReviewClose}
          onReviewComplete={handleRefresh}
        />
      )}
    </div>
  );
};
