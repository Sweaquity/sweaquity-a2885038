import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { Ticket } from "@/types/types";
import { Task } from "gantt-task-react";

interface ProjectTicketTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tickets: Ticket[];
  showKanban: boolean;
  showGantt: boolean;
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime: (ticketId: string, hours: number, description: string) => Promise<void>;
  renderTicketActions: (ticket: Ticket) => React.ReactNode;
  businessId: string;
  showTimeTracking?: boolean;
  expandedTickets?: Set<string>;
  toggleTicketExpansion?: (ticketId: string) => void;
}

export const ProjectTicketTabs: React.FC<ProjectTicketTabsProps> = ({
  activeTab,
  setActiveTab,
  tickets,
  showKanban,
  showGantt,
  onRefresh,
  onTicketAction,
  onLogTime,
  renderTicketActions,
  businessId,
  showTimeTracking = true, // Default to true for backward compatibility
  expandedTickets = new Set<string>(),
  toggleTicketExpansion = () => {}
}) => {
  const getActiveTickets = () => {
    if (!tickets) return [];
    
    switch (activeTab) {
      case "project-tasks":
        return tickets.filter(t => t.ticket_type === "task");
      case "project-tickets":
        return tickets.filter(t => t.ticket_type === "ticket");
      case "beta-testing":
        return tickets.filter(t => 
          t.ticket_type === "beta_testing" || 
          t.ticket_type === "beta-test" || 
          t.ticket_type === "beta-testing"
        );
      default:
        return tickets;
    }
  };

  // Enhanced ticket action handler to properly handle deletion
  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      // For delete actions, pass the businessId as data
      if (action === "deleteTicket") {
        return await onTicketAction(ticketId, action, businessId);
      }
      // For all other actions, pass the data as is
      return await onTicketAction(ticketId, action, data);
    } catch (error) {
      console.error(`Error in handleTicketAction (${action}):`, error);
      throw error; // Re-throw to allow proper error handling in components
    }
  };
  
  // Adapt the handler to match the expected interface
  const handleLogTime = (ticketId: string) => {
    // Show a dialog/modal to collect hours and description
    // This is just a stub that will call the actual onLogTime
    const hours = 0; // This would be collected from user input
    const description = ""; // This would be collected from user input
    onLogTime(ticketId, hours, description);
  };

  // Convert tickets to Gantt-compatible Task[] format
  const getGanttTasks = (): Task[] => {
    const activeTickets = getActiveTickets();
    return activeTickets.map((ticket) => {
      const startDate = new Date(ticket.created_at);
      let endDate = ticket.due_date ? new Date(ticket.due_date) : new Date();
      
      if (!ticket.due_date || endDate < startDate) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7); // Default to one week duration
      }
      
      return {
        id: ticket.id,
        name: ticket.title,
        start: startDate,
        end: endDate,
        progress: ticket.completion_percentage ? ticket.completion_percentage / 100 : 0,
        type: 'task',
        isDisabled: false,
        styles: { 
          progressColor: 
            ticket.priority === 'high' ? '#ef4444' : 
            ticket.priority === 'medium' ? '#f59e0b' : '#3b82f6',
          progressSelectedColor: 
            ticket.priority === 'high' ? '#dc2626' : 
            ticket.priority === 'medium' ? '#d97706' : '#2563eb'
        }
      };
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
        <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
        <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
        <TabsTrigger value="beta-testing">Beta Testing Tickets</TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab}>
        {showKanban ? (
          <div className="mb-6">
            <KanbanBoard 
              tickets={getActiveTickets()}
              onStatusChange={(ticketId, newStatus) => 
                handleTicketAction(ticketId, 'updateStatus', newStatus)
              }
              onTicketClick={(ticket) => {
                console.log("Ticket clicked:", ticket.id);
              }}
            />
          </div>
        ) : showGantt ? (
          <div className="mb-6">
            <GanttChartView tasks={getGanttTasks()} />
          </div>
        ) : (
          <TicketDashboard 
            initialTickets={getActiveTickets()}
            onRefresh={onRefresh}
            onTicketAction={handleTicketAction}
            showTimeTracking={showTimeTracking}
            userId={businessId}
            onLogTime={handleLogTime}
            renderTicketActions={renderTicketActions}
            expandedTickets={expandedTickets}
            toggleTicketExpansion={toggleTicketExpansion}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};
