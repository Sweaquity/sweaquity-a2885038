
import React from "react";
import { Ticket } from "@/types/types";
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { TicketTableHeader } from "./TicketTableHeader";
import { TicketTableRow } from "./TicketTableRow";
import { TicketService } from "../TicketService";
import { toast } from "sonner";

interface TicketTableProps {
  tickets: Ticket[];
  showTimeTracking: boolean;
  userCanEditStatus: boolean;
  openTicketDetails: (ticket: Ticket) => void;
  handleUpdateStatus: (ticketId: string, status: string) => void;
  handleUpdatePriority: (ticketId: string, priority: string) => void;
  showDeleteConfirmation: (ticket: Ticket) => void;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
}

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  showTimeTracking,
  userCanEditStatus,
  openTicketDetails,
  handleUpdateStatus,
  handleUpdatePriority,
  showDeleteConfirmation,
  onLogTime,
  renderTicketActions
}) => {
  // Create a wrapper function for showDeleteConfirmation that uses TicketService
  const handleShowDeleteConfirmation = async (ticket: Ticket) => {
    try {
      // First check if the ticket can be deleted using TicketService
      const canDelete = await TicketService.canDeleteTicket(ticket.id);
      if (!canDelete) {
        // canDeleteTicket already shows a toast error
        return;
      }
      
      // If we can delete, then call the provided function
      showDeleteConfirmation(ticket);
    } catch (error) {
      console.error("Error checking if ticket can be deleted:", error);
      toast.error("Failed to check if ticket can be deleted");
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TicketTableHeader showTimeTracking={showTimeTracking} />
        <TableBody>
          {tickets.map((ticket) => (
            <TicketTableRow
              key={ticket.id}
              ticket={ticket}
              showTimeTracking={showTimeTracking}
              userCanEditStatus={userCanEditStatus}
              openTicketDetails={openTicketDetails}
              handleUpdateStatus={handleUpdateStatus}
              handleUpdatePriority={handleUpdatePriority}
              showDeleteConfirmation={handleShowDeleteConfirmation}
              onLogTime={onLogTime}
              renderTicketActions={renderTicketActions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
