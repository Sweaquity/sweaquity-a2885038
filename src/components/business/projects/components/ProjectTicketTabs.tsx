
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Ticket } from "@/types/types";

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
  businessId
}) => {
  const getActiveTickets = () => {
    if (!tickets) return [];
    
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

  // Wrapper for ticket action to convert to Promise
  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    return onTicketAction(ticketId, action, data);
  };
  
  // Adapt the handler to match the expected interface
  const handleLogTime = (ticketId: string) => {
    // This is just a stub that will call the actual onLogTime with default values
    // The actual time logging UI will collect hours and description from the user
    onLogTime(ticketId, 0, "");
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
                // Here you could show a ticket detail dialog or navigate to a ticket details page
              }}
            />
          </div>
        ) : showGantt ? (
          <div className="mb-6">
            <div className="text-center py-8">
              <p>Gantt view is being implemented. Please check back later.</p>
            </div>
          </div>
        ) : (
          <TicketDashboard 
            initialTickets={getActiveTickets()}
            onRefresh={onRefresh}
            onTicketAction={handleTicketAction}
            showTimeTracking={true}
            userId={businessId || ''}
            onLogTime={handleLogTime}
            renderTicketActions={renderTicketActions}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};
