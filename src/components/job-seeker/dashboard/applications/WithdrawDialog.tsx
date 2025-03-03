
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export interface WithdrawDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    try {
      setIsSubmitting(true);
      await onWithdraw(reason || undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Error withdrawing application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isWithdrawing;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Application</DialogTitle>
          <DialogDescription>
            You can provide an optional reason for withdrawing your application. This will be visible to the project owner.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Optional reason for withdrawal..."
            className="min-h-[100px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={handleWithdraw} 
            disabled={isLoading}
          >
            {isLoading ? (
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
