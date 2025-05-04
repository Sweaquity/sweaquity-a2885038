
import React from "react";
import { Ticket } from "@/types/types";
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { TicketTableHeader } from "./TicketTableHeader";
import { TicketTableRow } from "./TicketTableRow";

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
              showDeleteConfirmation={showDeleteConfirmation}
              onLogTime={onLogTime}
              renderTicketActions={renderTicketActions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
