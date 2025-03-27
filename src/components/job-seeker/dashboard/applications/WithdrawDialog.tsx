
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface WithdrawDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw: (reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export const WithdrawDialog = ({ 
  isOpen, 
  onOpenChange, 
  onWithdraw,
  isLoading = false 
}: WithdrawDialogProps) => {
  const [reason, setReason] = useState("");

  const handleWithdraw = async () => {
    await onWithdraw(reason);
    setReason("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to withdraw your application? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Optional: Tell us why you're withdrawing this application..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleWithdraw}
            disabled={isLoading}
          >
            {isLoading ? "Withdrawing..." : "Withdraw Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
