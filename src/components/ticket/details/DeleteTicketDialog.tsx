import React from "react";
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
import { toast } from "sonner";

interface DeleteTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  ticketTitle: string;
  errorMessage?: string;
}

export const DeleteTicketDialog: React.FC<DeleteTicketDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
  ticketTitle,
  errorMessage,
}) => {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await onConfirm();
      toast.success("Ticket successfully deleted");
    } catch (error: any) {
      // Display a meaningful error message
      let message = "Failed to delete ticket";
      
      if (error?.message) {
        if (error.message.includes("time entries")) {
          message = "Cannot delete ticket with time entries";
        } else if (error.message.includes("completion progress")) {
          message = "Cannot delete ticket with completion progress";
        } else {
          message = `Failed to delete ticket: ${error.message}`;
        }
      }
      
      toast.error(message);
      // Keep the dialog open if there was an error
      return;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete ticket: <strong>{ticketTitle}</strong>
            <br />
            This action cannot be undone. The ticket will be archived and removed from view.
            <br /><br />
            <strong>Note:</strong> Tickets with time entries or completion progress cannot be deleted.
            
            {errorMessage && (
              <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-red-800">
                {errorMessage}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
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
