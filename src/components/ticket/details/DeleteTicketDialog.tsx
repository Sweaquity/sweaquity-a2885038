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
  isDeleting: boolean;
  ticketTitle: string;
  errorMessage?: string; // Added error message prop
}

export const DeleteTicketDialog: React.FC<DeleteTicketDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  ticketTitle,
  errorMessage
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this ticket?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete ticket: <strong>{ticketTitle}</strong>
            <br />
            This action cannot be undone. This will permanently delete the ticket and all related data.
            
            {errorMessage && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
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
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
