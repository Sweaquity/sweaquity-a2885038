
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
import { Application } from "@/types/business";

interface AcceptJobDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  application: JobApplication | Application | null;
  onAccept: () => Promise<void>;
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
      await onAccept();
      onOpenChange(false);
    } catch (error) {
      console.error("Error accepting job:", error);
    } finally {
      setAcceptingJob(false);
    }
  };

  if (!application) return null;

  // Extract applicant name safely with type guards
  const profile = 'profile' in application ? application.profile : null;
  const applicantFirstName = profile && typeof profile === 'object' && 'first_name' in profile ? 
    String(profile.first_name || "") : "";
  const applicantLastName = profile && typeof profile === 'object' && 'last_name' in profile ? 
    String(profile.last_name || "") : "";
  const applicantName = (applicantFirstName || applicantLastName) 
    ? `${applicantFirstName} ${applicantLastName}`.trim() 
    : "Applicant";

  // Extract business role information safely
  const businessRoles = 'business_roles' in application ? application.business_roles || {} : {};
  
  // Extract project title from various possible sources safely
  let projectTitle = "Untitled Project";
  if (typeof businessRoles === 'object') {
    if (businessRoles && 'project_title' in businessRoles && businessRoles.project_title) {
      projectTitle = String(businessRoles.project_title || "Untitled Project");
    } else if (businessRoles && 'project' in businessRoles && 
               typeof businessRoles.project === 'object' && 
               businessRoles.project && 
               'title' in businessRoles.project) {
      projectTitle = String(businessRoles.project.title || "Untitled Project");
    }
  }

  // Safely extract other business role properties
  const roleTitle = typeof businessRoles === 'object' && 'title' in businessRoles ? 
    String(businessRoles.title || "Untitled Role") : "Untitled Role";
    
  const equityAllocation = typeof businessRoles === 'object' && 'equity_allocation' in businessRoles ? 
    businessRoles.equity_allocation : null;
    
  const roleDescription = typeof businessRoles === 'object' && 'description' in businessRoles ? 
    String(businessRoles.description || "No description available") : "No description available";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Accept Job Contract</DialogTitle>
          <DialogDescription>
            You are accepting the job contract for "{roleTitle}" for {applicantName}.
            This will confirm your agreement to the equity terms.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md bg-muted p-4 mb-4">
            <h4 className="font-medium mb-2">Equity Terms:</h4>
            <p className="text-sm">{equityAllocation ? `${equityAllocation}% equity stake` : "No equity information available"}</p>
            
            <h4 className="font-medium mt-4 mb-2">Project:</h4>
            <p className="text-sm">{projectTitle}</p>
            
            <h4 className="font-medium mt-4 mb-2">Role:</h4>
            <p className="text-sm">{roleTitle}</p>
            
            <h4 className="font-medium mt-4 mb-2">Description:</h4>
            <p className="text-sm">{roleDescription}</p>
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
