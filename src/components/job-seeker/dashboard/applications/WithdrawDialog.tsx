
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface WithdrawDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw: (reason?: string) => Promise<void>;
  isWithdrawing?: boolean;
}

export const WithdrawDialog = ({
  isOpen,
  onOpenChange,
  onWithdraw,
  isWithdrawing = false
}: WithdrawDialogProps) => {
  const [reason, setReason] = useState("");

  const handleWithdraw = async () => {
    try {
      await onWithdraw(reason);
      setReason("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error withdrawing application:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Application</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for withdrawal (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you want to withdraw your application..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
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
