
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Ticket } from "@/types/types";
import { KanbanBoard } from "@/components/business/testing/KanbanBoard";
import { GanttChartView } from "@/components/business/testing/GanttChartView";

interface ProjectTicketTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tickets: Ticket[];
  showKanban: boolean;
  showGantt: boolean;
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string, hours: number, description: string) => Promise<void>;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  businessId: string;
  showTimeTracking?: boolean; // Add this prop
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
  showTimeTracking = true // Default to true for backward compatibility
}) => {
  const getFilteredTickets = () => {
    switch (activeTab) {
      case "project-tasks":
        return tickets.filter(t => t.ticket_type === "task");
      case "project-tickets":
        return tickets.filter(t => t.ticket_type === "ticket");
      case "beta-testing":
        return tickets.filter(t => t.ticket_type === "beta-test");
      default:
        return tickets;
    }
  };

  const handleTicketStatusChange = async (ticketId: string, newStatus: string) => {
    await onTicketAction(ticketId, 'updateStatus', newStatus);
  };

  const handleLogTimeForTicket = (ticketId: string) => {
    // This just triggers the dialog to open, the actual logging happens in the parent
    if (onLogTime) {
      // The parameters will be collected in the log time dialog
      onLogTime(ticketId, 0, "");
    }
  };

  const filteredTickets = getFilteredTickets();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
        <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
        <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
        <TabsTrigger value="beta-testing">Beta Testing</TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab}>
        {showKanban ? (
          <KanbanBoard 
            tickets={filteredTickets}
            onStatusChange={handleTicketStatusChange}
          />
        ) : showGantt ? (
          <GanttChartView 
            data={filteredTickets}
            onRefresh={onRefresh}
          />
        ) : (
          <TicketDashboard 
            initialTickets={filteredTickets}
            onRefresh={onRefresh}
            onTicketAction={onTicketAction}
            showTimeTracking={showTimeTracking} // Pass down the showTimeTracking prop
            userId={businessId}
            onLogTime={handleLogTimeForTicket}
            userCanEditDates={true} // Business can edit dates
            userCanEditStatus={true} // Business can edit status
          />
        )}
      </TabsContent>
    </Tabs>
  );
};
