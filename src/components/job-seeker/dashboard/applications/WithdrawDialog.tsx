
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface WithdrawDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw: (reason?: string) => void;
  isBusiness?: boolean;
  isWithdrawing?: boolean;
}

export const WithdrawDialog = ({
  isOpen,
  onOpenChange,
  onWithdraw,
  isBusiness = false,
  isWithdrawing = false
}: WithdrawDialogProps) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    if (isBusiness && !reason.trim()) {
      // For business users, a reason is required
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass reason even if empty for job seekers
      await onWithdraw(reason);
      setReason("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error withdrawing application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setReason("");
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Application</DialogTitle>
          <DialogDescription>
            {isBusiness 
              ? "Please provide a reason for rejecting this application. This will be shared with the applicant."
              : "You can optionally provide a reason for withdrawing your application."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">
              Reason {isBusiness && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter reason here..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-24"
              required={isBusiness}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isWithdrawing}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleWithdraw}
            disabled={isSubmitting || isWithdrawing || (isBusiness && !reason.trim())}
          >
            {isSubmitting || isWithdrawing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Withdrawing...
              </>
            ) : (
              "Withdraw Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
