
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JobApplication } from "@/types/jobSeeker";
import { Loader2 } from "lucide-react";

interface AcceptJobDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  application: JobApplication | null;
  onAccept: (application: JobApplication) => Promise<void>;
  isLoading?: boolean;
}

export const AcceptJobDialog = ({
  isOpen,
  onOpenChange,
  application,
  onAccept,
  isLoading = false
}: AcceptJobDialogProps) => {
  const [acceptingJob, setAcceptingJob] = useState(false);
  
  const handleAccept = async () => {
    if (!application) return;
    
    try {
      setAcceptingJob(true);
      await onAccept(application);
      onOpenChange(false);
    } catch (error) {
      console.error("Error accepting job:", error);
    } finally {
      setAcceptingJob(false);
    }
  };

  if (!application) return null;

  // Extract applicant name from various possible sources
  // It could be in application.profile or directly in the business_roles data
  const applicantFirstName = application.profile?.first_name || "";
  const applicantLastName = application.profile?.last_name || "";
  const applicantName = (applicantFirstName || applicantLastName) 
    ? `${applicantFirstName} ${applicantLastName}`.trim() 
    : "Applicant";

  // Extract project title from various possible sources
  const projectTitle = application.business_roles?.project_title || 
                     (application.business_roles?.project?.title) || 
                     "Untitled Project";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Accept Job Contract</DialogTitle>
          <DialogDescription>
            You are accepting the job contract for "{application.business_roles?.title}" for {applicantName}.
            This will confirm your agreement to the equity terms.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md bg-muted p-4 mb-4">
            <h4 className="font-medium mb-2">Equity Terms:</h4>
            <p className="text-sm">{application.business_roles?.equity_allocation}% equity stake</p>
            
            <h4 className="font-medium mt-4 mb-2">Project:</h4>
            <p className="text-sm">{projectTitle}</p>
            
            <h4 className="font-medium mt-4 mb-2">Role:</h4>
            <p className="text-sm">{application.business_roles?.title}</p>
            
            <h4 className="font-medium mt-4 mb-2">Description:</h4>
            <p className="text-sm">{application.business_roles?.description}</p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Once both you and the job seeker accept, a formal contract will be generated for review and signature.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button"
            variant="default"
            onClick={handleAccept} 
            disabled={isLoading || acceptingJob}
          >
            {(isLoading || acceptingJob) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
};
