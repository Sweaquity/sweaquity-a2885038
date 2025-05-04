
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
import { Ticket } from "@/types/types";

interface DeleteTicketDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  ticketToDelete: Ticket | null;
}

export const DeleteTicketDialog: React.FC<DeleteTicketDialogProps> = ({
  isOpen,
  ticketToDelete,
  onCancel,
  onConfirm,
  isDeleting = false
}) => {
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
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
