import { useState, useEffect } from "react";
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
import { Loader2, FileText } from "lucide-react";
import { Application } from "@/types/business";
import { useWorkContractManagement } from "@/hooks/useWorkContractManagement";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AcceptJobDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  application: JobApplication | Application | null;
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
  const [willCreateContract, setWillCreateContract] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  
  const { isGenerating, generateWorkContract } = useWorkContractManagement();
  
  useEffect(() => {
    // Get the business ID if not present in application
    const getBusinessInfo = async () => {
      if (!application?.project_id) return;
      
      try {
        const { data, error } = await supabase
          .from('business_projects')
          .select('business_id')
          .eq('project_id', application.project_id)
          .single();
        
        if (error) throw error;
        setBusinessId(data.business_id);
      } catch (error) {
        console.error("Error fetching business ID:", error);
      }
    };
    
    if (isOpen && application) {
      // If we have application.business_id, use that
      if ('business_id' in application && application.business_id) {
        setBusinessId(application.business_id);
      } 
      // If we're using Application from business types and have businesses.businesses_id
      else if ('businesses' in application && application.businesses?.businesses_id) {
        setBusinessId(application.businesses.businesses_id);
      }
      // Otherwise fetch from the project
      else {
        getBusinessInfo();
      }
    }
  }, [isOpen, application]);
  
  const handleAccept = async () => {
    if (!application) return;
    
    try {
      setAcceptingJob(true);
      await onAccept(application as JobApplication);
      
      // If we want to create a work contract, set up for that next
      if (willCreateContract) {
        toast.success("Job accepted successfully. A work contract will be available in the Contract section.");
      } else {
        toast.success("Job accepted successfully.");
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error("Failed to accept job");
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
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-contract"
              checked={willCreateContract}
              onChange={() => setWillCreateContract(!willCreateContract)}
              className="rounded"
            />
            <label htmlFor="create-contract" className="text-sm">
              Generate formal work contract after acceptance
            </label>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Once both you and the {
              'profile' in application ? 'job seeker' : 'business'
            } accept, {willCreateContract ? 'a formal contract will be generated for review and signature.' : 'the job will be considered active.'}
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
              <>
                <FileText className="mr-2 h-4 w-4" />
                Accept Job
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
