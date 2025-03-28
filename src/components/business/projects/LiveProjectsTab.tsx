
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectTicketFilters } from "./components/ProjectTicketFilters";
import { ProjectStatsSummary } from "./components/ProjectStatsSummary";
import { ProjectTicketTabs } from "./components/ProjectTicketTabs";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { TaskCompletionReview } from "./TaskCompletionReview";
import { Ticket } from "@/types/types";
import { 
  loadTickets, 
  fetchProjects, 
  handleTicketAction as handleTicketActionService,
  handleLogTime as handleLogTimeService,
  createTicket
} from "./services/ticketService";

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
    const ticketsData = await loadTickets(businessId, selectedProject);
    setTickets(ticketsData);
    
    // Calculate ticket stats
    const stats = {
      total: ticketsData.length,
      open: ticketsData.filter(t => t.status !== 'done' && t.status !== 'closed').length,
      closed: ticketsData.filter(t => t.status === 'done' || t.status === 'closed').length,
      highPriority: ticketsData.filter(t => t.priority === 'high').length
    };
    
    setTaskStats(stats);
    setLoading(false);
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    if (action === 'reviewCompletion') {
      // Find the ticket to review
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
    // Reload tickets to reflect changes
    loadTicketsData();
  };

  const renderTicketActions = (ticket: Ticket) => {
    // Only show review action for business users and if the ticket is in review status
    if (ticket.status === 'review' || ticket.status === 'in review') {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <p className="text-muted-foreground">View and manage all your active projects</p>
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
        businessId={businessId}
      />

      <CreateTicketDialog
        open={isCreateTicketDialogOpen}
        onClose={() => setIsCreateTicketDialogOpen(false)}
        onCreateTicket={handleTicketCreated}
        projects={projects}
      />

      {reviewTask && (
        <TaskCompletionReview
          businessId={businessId}
          task={reviewTask}
          open={isReviewOpen}
          setOpen={setIsReviewOpen}
          onClose={handleReviewClose}
        />
      )}
    </div>
  );
};
