
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobApplication } from "@/types/jobSeeker";
import { Clock } from "lucide-react";

interface AcceptJobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication;
  onAccept: () => Promise<void>;
  isLoading: boolean;
}

export const AcceptJobDialog = ({
  isOpen,
  onOpenChange,
  application,
  onAccept,
  isLoading,
}: AcceptJobDialogProps) => {
  const handleAccept = async () => {
    await onAccept();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept Job Offer</DialogTitle>
          <DialogDescription>
            You are about to accept this job offer for{" "}
            <span className="font-medium">
              {application.business_roles?.title || "the role"}
            </span>
            . This will indicate your commitment to work on this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-medium">Project Details</h4>
            <p className="text-sm text-muted-foreground">
              {application.business_roles?.project_title || "Untitled Project"} at{" "}
              {application.business_roles?.company_name || "Unknown Company"}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium">Equity Allocation</h4>
            <p className="text-sm text-muted-foreground">
              {application.business_roles?.equity_allocation || 0}%
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium">Timeframe</h4>
            <p className="text-sm text-muted-foreground">
              {application.business_roles?.timeframe || "Not specified"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept Job"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
