
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const TicketDialog = ({ 
  open, 
  onOpenChange, 
  children 
}: TicketDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {children}
      </DialogContent>
    </Dialog>
  );
};
