
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Ticket } from "@/types/types";
import { TicketService } from "../TicketService";

interface DeleteTicketDialogProps {
  isOpen: boolean;
  ticketToDelete: Ticket | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteTicketDialog: React.FC<DeleteTicketDialogProps> = ({
  isOpen,
  ticketToDelete,
  onCancel,
  onConfirm,
  isDeleting = false
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleConfirm = async () => {
    if (!ticketToDelete) return;
    
    try {
      // Check if the ticket can be deleted
      const canDelete = await TicketService.canDeleteTicket(ticketToDelete.id);
      if (!canDelete) {
        setErrorMessage("Cannot delete ticket with time entries or completion progress");
        return;
      }
      
      // If we can delete, proceed with the confirmation
      setErrorMessage(undefined);
      await onConfirm();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to check if ticket can be deleted");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {ticketToDelete && (
              <>
                You are about to delete ticket: <strong>{ticketToDelete.title}</strong>
                <br />
              </>
            )}
            This action cannot be undone. The ticket will be archived and removed from view.
            <br /><br />
            <strong>Note:</strong> Tickets with time entries or completion progress cannot be deleted.
            
            {errorMessage && (
              <div className="mt-2 p-2 bg-red-100 text-red-800 rounded">
                {errorMessage}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
