
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ticket } from "@/types/types";
import { ExpandedTicketDetails } from "../ExpandedTicketDetails";

interface TicketDetailDialogProps {
  isOpen: boolean;
  selectedTicket: Ticket | null;
  onClose: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  showTimeTracking: boolean;
  userCanEditStatus: boolean;
  userCanEditDates: boolean;
}

export const TicketDetailDialog: React.FC<TicketDetailDialogProps> = ({
  isOpen,
  selectedTicket,
  onClose,
  onTicketAction,
  onLogTime,
  showTimeTracking,
  userCanEditStatus,
  userCanEditDates,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogTitle>Ticket Details</DialogTitle>
        {selectedTicket && (
          <ExpandedTicketDetails
            ticket={selectedTicket}
            onClose={onClose}
            onTicketAction={onTicketAction}
            onLogTime={showTimeTracking && onLogTime ? onLogTime : undefined}
            userCanEditStatus={userCanEditStatus}
            userCanEditDates={userCanEditDates}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
