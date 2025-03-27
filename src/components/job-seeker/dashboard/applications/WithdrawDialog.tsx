
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface WithdrawDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw: (reason?: string) => Promise<void>;
  isLoading: boolean;
}

export const WithdrawDialog = ({
  isOpen,
  onOpenChange,
  onWithdraw,
  isLoading
}: WithdrawDialogProps) => {
  const [reason, setReason] = useState("");

  const handleWithdraw = async () => {
    await onWithdraw(reason.trim() || undefined);
    setReason("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Withdraw Application</DialogTitle>
        <DialogDescription>
          Are you sure you want to withdraw this application? This action cannot be undone.
        </DialogDescription>

        <div className="py-4">
          <Textarea
            placeholder="Reason for withdrawing (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter className="gap-2">
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
