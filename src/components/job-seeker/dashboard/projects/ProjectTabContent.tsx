import React from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { KanbanBoard } from "@/components/business/testing/KanbanBoard";
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
  // Remove custom delete button and let TicketTableRow handle deletion
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
            />
          </DragDropContext>
        </div>
      ) : showGantt ? (
        <div className="mb-6">
          <div className="text-center py-8">
            <p>Gantt view is being implemented. Please check back later.</p>
          </div>
        </div>
      ) : (
        <TicketDashboard 
          initialTickets={activeTickets}
          onRefresh={onRefresh}
          onTicketAction={onTicketAction}
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
