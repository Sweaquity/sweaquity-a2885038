
import { Dialog, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JobApplication } from "@/types/jobSeeker";

interface AcceptJobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => Promise<void>;
  application: JobApplication;
  isLoading?: boolean;
}

export const AcceptJobDialog = ({
  isOpen,
  onOpenChange,
  onAccept,
  application,
  isLoading = false
}: AcceptJobDialogProps) => {
  const handleAccept = async () => {
    await onAccept();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Accept Job Offer</DialogTitle>
        <DialogDescription>
          You are about to accept the job offer for {application.business_roles?.title || "this position"}.
          This will create a binding agreement between you and the business.
        </DialogDescription>

        <div className="py-2 space-y-2">
          <div>
            <p className="font-medium">Company:</p>
            <p className="text-sm">{application.business_roles?.company_name || "Unknown Company"}</p>
          </div>
          
          <div>
            <p className="font-medium">Position:</p>
            <p className="text-sm">{application.business_roles?.title || "Untitled Position"}</p>
          </div>
          
          {application.business_roles?.equity_allocation && (
            <div>
              <p className="font-medium">Equity Allocation:</p>
              <p className="text-sm">{application.business_roles.equity_allocation}%</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAccept} disabled={isLoading}>
            {isLoading ? "Accepting..." : "Accept Job Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
