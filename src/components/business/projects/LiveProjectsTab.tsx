
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectTicketFilters } from "./components/ProjectTicketFilters";
import { ProjectStatsSummary } from "./components/ProjectStatsSummary";
import { ProjectTicketTabs } from "./components/ProjectTicketTabs";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { TaskCompletionReview } from "./TaskCompletionReview";
import { Ticket } from "@/types/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { 
  loadTickets, 
  fetchProjects, 
  handleTicketAction as handleTicketActionService,
  handleLogTime as handleLogTimeService,
  createTicket
} from "./services/ticketService";
import { supabase } from "@/lib/supabase";

interface LiveProjectsTabProps {
  businessId: string;
}

export const LiveProjectsTab = ({ businessId }: LiveProjectsTabProps) => {
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

  useEffect(() => {
    if (businessId) {
      loadProjectsData();
      loadTicketsData();
    }
  }, [businessId]);
  
  useEffect(() => {
    if (businessId) {
      loadTicketsData();
    }
  }, [businessId, selectedProject]);

  const loadProjectsData = async () => {
    const projectsData = await fetchProjects(businessId);
    setProjects(projectsData);
  };

  const loadTicketsData = async () => {
    setLoading(true);
    try {
      // Get job applications with incomplete equity allocation
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          job_app_id,
          task_id,
          accepted_jobs (
            equity_agreed,
            jobs_equity_allocated
          )
        `)
        .eq('accepted_business', true)
        .eq('accepted_jobseeker', true);

      if (applicationsError) throw applicationsError;

      // Filter applications where equity is not fully allocated
      const nonFullyAllocatedApplications = applicationsData.filter(app => 
        app.accepted_jobs && 
        app.accepted_jobs.equity_agreed > 0 &&
        app.accepted_jobs.equity_agreed > app.accepted_jobs.jobs_equity_allocated
      );

      if (nonFullyAllocatedApplications.length === 0) {
        setTickets([]);
        setTaskStats({
          total: 0,
          open: 0,
          closed: 0,
          highPriority: 0
        });
        setLoading(false);
        return;
      }

      const taskIds = nonFullyAllocatedApplications.map(app => app.task_id);

      // Now load tickets that match these task IDs
      let query = supabase
        .from('tickets')
        .select('*')
        .in('task_id', taskIds);
        
      if (selectedProject !== "all") {
        query = query.eq('project_id', selectedProject);
      }
        
      const { data: ticketsData, error: ticketsError } = await query;
      
      if (ticketsError) throw ticketsError;
      
      // Format tickets
      const formattedTickets = (ticketsData || []).map(ticket => ({
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
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    if (action === 'reviewCompletion') {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setReviewTask(ticket);
        setIsReviewOpen(true);
      }
      return;
    }
    
    await handleTicketActionService(ticketId, action, data, businessId, tickets, setTickets);
  };

  const handleLogTime = async (ticketId: string, hours: number, description: string) => {
    const success = await handleLogTimeService(ticketId, hours, description);
    if (success) {
      loadTicketsData();
    }
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

  const handleTicketCreated = async (ticketData: any): Promise<void> => {
    const newTicket = await createTicket(ticketData, businessId);
    if (newTicket) {
      setTickets([newTicket, ...tickets]);
      setIsCreateTicketDialogOpen(false);
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
        <div className="flex flex-col space-y-2">
          <h2 className="text-2xl font-bold">Live Projects</h2>
          <p className="text-muted-foreground">Projects with ongoing equity allocation</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No Active Equity Projects</h3>
              <p className="text-muted-foreground">
                There are no projects with ongoing equity allocation.
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
        <h2 className="text-2xl font-bold">Project Management</h2>
        <p className="text-muted-foreground">View and manage all your active projects</p>
      </div>

      <Alert variant="outline" className="mb-4">
        <InfoIcon className="h-4 w-4 mr-2" />
        <AlertDescription>
          This tab only shows projects with ongoing equity allocation (where agreed equity has not been fully allocated yet).
        </AlertDescription>
      </Alert>

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
        businessId={businessId}
        showTimeTracking={false}
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
          onReviewComplete={() => loadTicketsData()}
          businessId={businessId}
        />
      )}
    </div>
  );
};
