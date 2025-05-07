import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAwardAgreementManagement } from "@/hooks/useAwardAgreementManagement";
import { Loader2 } from "lucide-react";

interface TaskCompletionReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  onReviewComplete: (approved: boolean, notes: string) => Promise<void>;
  ticketData: {
    title: string;
    description?: string;
    completion_percentage?: number;
    project_id?: string;
    assigned_to?: string;
    job_app_id?: string;
    task_id?: string;
  };
}

export const TaskCompletionReview = ({
  open,
  onOpenChange,
  ticketId,
  onReviewComplete,
  ticketData
}: TaskCompletionReviewProps) => {
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingAgreement, setIsGeneratingAgreement] = useState<boolean>(false);
  const [hasExistingAgreement, setHasExistingAgreement] = useState<boolean | null>(null);
  const [acceptedJobId, setAcceptedJobId] = useState<string | null>(null);
  
  const { 
    isGenerating, 
    generateAwardAgreement,
    getAwardAgreement
  } = useAwardAgreementManagement();
  
  // Check if task is 100% complete
  const isTaskComplete = ticketData?.completion_percentage === 100;
  
  // Check if we need to generate an award agreement
  const shouldGenerateAgreement = isTaskComplete && ticketData.job_app_id && ticketData.project_id;

  // Effect to check if award agreement already exists when dialog opens
  const checkExistingAgreement = async () => {
    if (!ticketData.job_app_id || !open) return;
    
    try {
      setIsLoading(true);
      
      // First get the accepted_job
      const { data: acceptedJob, error: acceptedJobError } = await supabase
        .from('accepted_jobs')
        .select('id, award_agreement_document_id')
        .eq('job_app_id', ticketData.job_app_id)
        .maybeSingle();
        
      if (acceptedJobError) throw acceptedJobError;
      
      if (acceptedJob) {
        setAcceptedJobId(acceptedJob.id);
        setHasExistingAgreement(!!acceptedJob.award_agreement_document_id);
      } else {
        setHasExistingAgreement(false);
      }
    } catch (error) {
      console.error('Error checking existing award agreement:', error);
      setHasExistingAgreement(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (open && hasExistingAgreement === null) {
    checkExistingAgreement();
  }
  
  const handleApprove = async () => {
    try {
      setIsLoading(true);
      await onReviewComplete(true, notes);
      
      // If task is complete and we need to generate an agreement
      if (shouldGenerateAgreement && !hasExistingAgreement && acceptedJobId) {
        await handleGenerateAgreement();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error in task review:', error);
      toast.error('Failed to complete review');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      await onReviewComplete(false, notes);
      onOpenChange(false);
    } catch (error) {
      console.error('Error in task review:', error);
      toast.error('Failed to complete review');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateAgreement = async () => {
    if (!ticketData.job_app_id || !ticketData.project_id || !acceptedJobId) {
      toast.error("Missing required information to generate agreement");
      return;
    }
    
    try {
      setIsGeneratingAgreement(true);
      
      // Get the project's business ID
      const { data: projectData, error: projectError } = await supabase
        .from('business_projects')
        .select('business_id')
        .eq('project_id', ticketData.project_id)
        .single();
        
      if (projectError) throw projectError;
      
      // Get the user ID (jobseeker)
      const { data: applicationData, error: appError } = await supabase
        .from('job_applications')
        .select('user_id')
        .eq('job_app_id', ticketData.job_app_id)
        .single();
        
      if (appError) throw appError;
      
      const businessId = projectData.business_id;
      const jobseekerId = applicationData.user_id;
      const projectId = ticketData.project_id;
      
      // Generate the award agreement
      await generateAwardAgreement(
        acceptedJobId, 
        businessId,
        jobseekerId,
        projectId,
        ticketData.job_app_id,
        `completed the task "${ticketData.title}" with 100% completion`
      );
      
      toast.success('Equity Award Agreement has been generated');
    } catch (error) {
      console.error('Error generating award agreement:', error);
      toast.error('Failed to generate Equity Award Agreement');
    } finally {
      setIsGeneratingAgreement(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Task Completion</DialogTitle>
          <DialogDescription>
            {isTaskComplete 
              ? "This task is marked as 100% complete. Please review the work and provide feedback."
              : "Review the progress on this task and provide feedback."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Task</h3>
            <p className="text-sm">{ticketData?.title}</p>
          </div>
          
          {ticketData?.description && (
            <div>
              <h3 className="text-sm font-medium mb-1">Description</h3>
              <p className="text-sm">{ticketData.description}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium mb-1">Completion</h3>
            <p className="text-sm">{ticketData?.completion_percentage || 0}%</p>
          </div>
          
          {/* Show award agreement information if task is 100% complete */}
          {isTaskComplete && shouldGenerateAgreement && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                {hasExistingAgreement === true ? (
                  "An Equity Award Agreement has already been generated for this task."
                ) : hasExistingAgreement === false ? (
                  "Approving this 100% complete task will automatically generate an Equity Award Agreement."
                ) : (
                  "Checking award agreement status..."
                )}
              </p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium mb-1">Your Notes</h3>
            <Textarea
              placeholder="Add your review notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={handleReject}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Request Changes'
            )}
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={isLoading || isGeneratingAgreement || isGenerating}
          >
            {(isLoading || isGeneratingAgreement || isGenerating) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isGeneratingAgreement ? 'Generating Agreement...' : 'Approving...'}
              </>
            ) : (
              'Approve'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
