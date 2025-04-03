
import React from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { Ticket } from "@/types/types";
import { TicketStatus } from "./TicketStatus";
import { TicketPriority } from "./TicketPriority";
import { TicketDueDate } from "./TicketDueDate";
import { TicketEstimatedHours } from "./TicketEstimatedHours";
import { TicketCompletion } from "./TicketCompletion";
import { TicketDescription } from "./TicketDescription";

interface TicketDetailsTabProps {
  ticket: Ticket;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
}

export const TicketDetailsTab: React.FC<TicketDetailsTabProps> = ({
  ticket,
  onTicketAction,
  onLogTime,
  userCanEditStatus = true,
  userCanEditDates = true
}) => {
  const handleStatusChange = async (value: string) => {
    await onTicketAction(ticket.id, "updateStatus", value);
  };

  const handlePriorityChange = async (value: string) => {
    await onTicketAction(ticket.id, "updatePriority", value);
  };

  const handleDueDateChange = async (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      await onTicketAction(ticket.id, "updateDueDate", formattedDate);
    } else {
      await onTicketAction(ticket.id, "updateDueDate", null);
    }
  };

  const handleCompletionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    await onTicketAction(ticket.id, "updateCompletionPercentage", value);
  };

  const handleEstimatedHoursChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    await onTicketAction(ticket.id, "updateEstimatedHours", value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TicketStatus 
          status={ticket.status} 
          disabled={!userCanEditStatus}
          onChange={handleStatusChange}
        />
        <TicketPriority 
          priority={ticket.priority} 
          disabled={!userCanEditStatus}
          onChange={handlePriorityChange}
        />
        <TicketDueDate 
          date={ticket.due_date ? new Date(ticket.due_date) : undefined}
          disabled={!userCanEditDates}
          onChange={handleDueDateChange}
        />
        <TicketEstimatedHours 
          hours={ticket.estimated_hours || 0}
          disabled={!userCanEditDates}
          onChange={handleEstimatedHoursChange}
        />
        <TicketCompletion 
          percentage={ticket.completion_percentage || 0}
          disabled={!userCanEditStatus}
          onChange={handleCompletionChange}
        />
      </div>

      <TicketDescription description={ticket.description} />

      {onLogTime && (
        <div className="pt-4">
          <Button onClick={() => onLogTime(ticket.id)}>
            <Clock className="h-4 w-4 mr-2" /> Log Time
          </Button>
        </div>
      )}
    </div>
  );
};
