
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WithdrawDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw: (reason: string) => Promise<void>;
  isWithdrawing: boolean;
}

export const WithdrawDialog = ({ 
  isOpen, 
  onOpenChange,
  onWithdraw,
  isWithdrawing
}: WithdrawDialogProps) => {
  const [withdrawReason, setWithdrawReason] = useState("");

  const handleWithdraw = async () => {
    await onWithdraw(withdrawReason);
    setWithdrawReason(""); // Reset reason after submission
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to withdraw your application? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason for withdrawing (required)
            </label>
            <Textarea
              id="reason"
              placeholder="Please explain why you're withdrawing your application..."
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleWithdraw}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? "Withdrawing..." : "Withdraw Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
