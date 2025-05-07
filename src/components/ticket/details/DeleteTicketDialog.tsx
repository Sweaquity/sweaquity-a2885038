
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
      // The parent component will handle the success toast
    } catch (error: any) {
      // Don't display a toast here, as the parent component already handles error notifications
      // This prevents duplicate toast messages
      console.error("Error in DeleteTicketDialog:", error);
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
            <strong>Note:</strong> Tickets with time entries, completion progress, or associated legal documents cannot be deleted.
            
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
