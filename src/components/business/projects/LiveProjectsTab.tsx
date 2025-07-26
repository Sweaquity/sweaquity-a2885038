
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectTicketFilters } from "./components/ProjectTicketFilters";
import { ProjectStatsSummary } from "./components/ProjectStatsSummary";
import { ProjectTicketTabs } from "./components/ProjectTicketTabs";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { TaskCompletionReview } from "./TaskCompletionReview";
import { Ticket } from "@/types/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
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
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

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
    // Filter out tickets with status 'deleted' to respect our soft-deletion approach
    const activeTickets = ticketsData.filter(ticket => ticket.status !== 'deleted');
    setTickets(activeTickets);
    
    const stats = {
      total: activeTickets.length,
      open: activeTickets.filter(t => t.status !== 'done' && t.status !== 'closed').length,
      closed: activeTickets.filter(t => t.status === 'done' || t.status === 'closed').length,
      highPriority: activeTickets.filter(t => t.priority === 'high').length
    };
    
    setTaskStats(stats);
    setLoading(false);
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    if (action === 'reviewCompletion') {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        console.log("Reviewing completion for ticket:", ticket);
        setReviewTask(ticket);
        setIsReviewOpen(true);
      }
      return;
    }
    
    if (action === 'delete') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Authentication required");
          return;
        }

        // Use the RPC function for soft deletion
        const { error } = await supabase.rpc('soft_delete_ticket', {
          ticket_id: ticketId,
          user_id: session.user.id
        });

        if (error) {
          console.error("Error deleting ticket:", error);
          if (error.message.includes('time entries')) {
            toast.error('Cannot delete ticket with logged time entries');
          } else if (error.message.includes('completion progress')) {
            toast.error('Cannot delete ticket with completion progress');
          } else {
            toast.error('Failed to delete ticket');
          }
          return;
        }

        toast.success('Ticket deleted successfully');
        loadTicketsData(); // Refresh the tickets list
      } catch (error) {
        console.error('Error deleting ticket:', error);
        toast.error('Failed to delete ticket');
      }
      return;
    }
    
    if (action === 'refreshTicket') {
      // Refresh the specific ticket data
      const { data: refreshedTicket, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (error) {
        console.error("Error refreshing ticket:", error);
        return;
      }
      
      if (refreshedTicket) {
        setTickets(prevTickets => 
          prevTickets.map(t => t.id === ticketId ? refreshedTicket : t)
        );
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
  
  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const renderTicketActions = (ticket: Ticket) => {
    // Improved condition to check for tickets in review status
    // This will also log tickets that should be in review to help with debugging
    if ((ticket.status === 'review' || ticket.status === 'in review')) {
      console.log("Found ticket in review status:", ticket);
      return (
        <Button
          variant="default"
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
        showTimeTracking={false}
        expandedTickets={expandedTickets}
        toggleTicketExpansion={toggleTicketExpansion}
      />

      <CreateTicketDialog
        open={isCreateTicketDialogOpen}
        onClose={() => setIsCreateTicketDialogOpen(false)}
        onCreateTicket={handleTicketCreated}
        projects={projects}
      />

      {reviewTask && (
        <TaskCompletionReview
          ticketId={reviewTask.id}
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          onReviewComplete={async (approved: boolean, notes: string) => {
            // Handle review completion
            try {
              const { error } = await supabase
                .from('tickets')
                .update({ 
                  status: approved ? 'done' : 'in_progress',
                  notes: reviewTask.notes ? [...reviewTask.notes, {
                    id: Date.now().toString(),
                    user: 'Business Review',
                    comment: notes,
                    timestamp: new Date().toISOString()
                  }] : [{
                    id: Date.now().toString(),
                    user: 'Business Review',
                    comment: notes,
                    timestamp: new Date().toISOString()
                  }]
                })
                .eq('id', reviewTask.id);
                
              if (error) throw error;
              
              loadTicketsData();
              toast.success(approved ? 'Task approved successfully' : 'Task sent back for changes');
            } catch (error) {
              console.error('Error updating task:', error);
              toast.error('Failed to update task');
            }
          }}
          ticketData={{
            title: reviewTask.title,
            description: reviewTask.description,
            completion_percentage: reviewTask.completion_percentage,
            project_id: reviewTask.project_id,
            assigned_to: reviewTask.assigned_to,
            job_app_id: reviewTask.job_app_id,
            task_id: reviewTask.task_id
          }}
        />
      )}
    </div>
  );
};
