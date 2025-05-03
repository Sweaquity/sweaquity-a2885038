import React from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { KanbanBoard } from "@/components/business/testing/KanbanBoard";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { Ticket } from "@/types/types";

interface ProjectTabContentProps {
  activeTickets: Ticket[];
  showKanban: boolean;
  showGantt: boolean;
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime: (ticketId: string) => void;
  userId: string;
  expandedTickets: Set<string>;
  toggleTicketExpansion: (ticketId: string) => void;
  onDeleteTicket: (ticket: Ticket) => void;
  handleDragEnd: (result: DropResult) => void;
}

export const ProjectTabContent: React.FC<ProjectTabContentProps> = ({
  activeTickets,
  showKanban,
  showGantt,
  onRefresh,
  onTicketAction,
  onLogTime,
  userId,
  expandedTickets,
  toggleTicketExpansion,
  onDeleteTicket,
  handleDragEnd
}) => {
  // Enhanced ticket action handler to properly handle deletion
  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      // For delete actions, pass the userId as data
      if (action === "deleteTicket") {
        return await onTicketAction(ticketId, action, userId);
      }
      // For all other actions, pass the data as is
      return await onTicketAction(ticketId, action, data);
    } catch (error) {
      console.error(`Error in handleTicketAction (${action}):`, error);
      throw error; // Re-throw to allow proper error handling in components
    }
  };

  return (
    <>
      {showKanban ? (
        <div className="mb-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <KanbanBoard 
              tickets={activeTickets}
              onStatusChange={(ticketId, newStatus) => 
                onTicketAction(ticketId, 'updateStatus', newStatus)
              }
              onTicketClick={(ticket) => {
                console.log("Ticket clicked:", ticket.id);
              }}
              onTicketDelete={onDeleteTicket}
            />
          </DragDropContext>
        </div>
      ) : showGantt ? (
        <div className="mb-6">
          <GanttChartView 
            tickets={activeTickets}
            onTicketAction={handleTicketAction}
          />
        </div>
      ) : (
        <TicketDashboard 
          initialTickets={activeTickets}
          onRefresh={onRefresh}
          onTicketAction={handleTicketAction}
          showTimeTracking={true}
          userId={userId}
          onLogTime={onLogTime}
          userCanEditDates={true}
          userCanEditStatus={true}
          expandedTickets={expandedTickets}
          toggleTicketExpansion={toggleTicketExpansion}
        />
      )}
    </>
  );
};
