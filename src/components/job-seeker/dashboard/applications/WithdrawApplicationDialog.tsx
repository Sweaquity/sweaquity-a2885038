
import React, { useState } from 'react';
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

interface WithdrawApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onWithdraw: (reason: string) => Promise<void>;
  isWithdrawing: boolean;
}

export const WithdrawApplicationDialog: React.FC<WithdrawApplicationDialogProps> = ({
  open,
  onClose,
  onWithdraw,
  isWithdrawing
}) => {
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onWithdraw(reason);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Application</DialogTitle>
          <DialogDescription>
            Please provide a reason for withdrawing your application. This will help us improve our platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for withdrawal..."
              rows={5}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isWithdrawing}>
              Cancel
            </Button>
            <Button type="submit" disabled={isWithdrawing || !reason.trim()}>
              {isWithdrawing ? "Withdrawing..." : "Withdraw Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
