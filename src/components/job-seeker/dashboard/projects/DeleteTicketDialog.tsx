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

interface DeleteTicketDialogProps {
  isOpen: boolean;
  ticketToDelete: Ticket | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteTicketDialog: React.FC<DeleteTicketDialogProps> = ({
  isOpen,
  ticketToDelete,
  onCancel,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      // You could add toast notification here
    } finally {
      setIsDeleting(false);
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
