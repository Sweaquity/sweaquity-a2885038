
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { JobApplication } from "@/types/jobSeeker";
import { AcceptedJob, useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { File, Upload } from "lucide-react";
import { toast } from "sonner";

interface AcceptJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplication;
  onApplicationUpdated?: () => void;
  isJobSeeker?: boolean;
}

export const AcceptJobDialog = ({
  isOpen,
  onClose,
  application,
  onApplicationUpdated,
  isJobSeeker = true
}: AcceptJobDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [equityAmount, setEquityAmount] = useState<number>(
    application.business_roles?.equity_allocation || 0
  );
  const [discourse, setDiscourse] = useState<string>("");
  const [acceptedJob, setAcceptedJob] = useState<AcceptedJob | null>(null);
  const [hasAccepted, setHasAccepted] = useState<boolean>(
    isJobSeeker ? !!application.accepted_jobseeker : !!application.accepted_business
  );
  
  const { 
    isLoading, 
    isUploading, 
    acceptJobAsJobSeeker, 
    acceptJobAsBusiness,
    uploadContract,
    updateEquityTerms,
    getAcceptedJob
  } = useAcceptedJobs(onApplicationUpdated);

  useEffect(() => {
    if (isOpen && application.job_app_id) {
      const fetchAcceptedJob = async () => {
        const data = await getAcceptedJob(application.job_app_id);
        if (data) {
          setAcceptedJob(data);
          setEquityAmount(data.equity_agreed);
          setDiscourse(data.accepted_discourse || "");
        }
      };
      
      fetchAcceptedJob();
    }
  }, [isOpen, application.job_app_id, getAcceptedJob]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a PDF file
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      
      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit");
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleAccept = async () => {
    if (isJobSeeker) {
      await acceptJobAsJobSeeker(application);
    } else {
      await acceptJobAsBusiness(application);
    }
    
    setHasAccepted(true);
  };
  
  const handleUploadContract = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    
    const url = await uploadContract(application.job_app_id, file);
    if (url) {
      setFile(null);
      // Refresh the accepted job data
      const data = await getAcceptedJob(application.job_app_id);
      if (data) {
        setAcceptedJob(data);
      }
    }
  };
  
  const handleUpdateTerms = async () => {
    await updateEquityTerms(application.job_app_id, equityAmount, discourse);
  };
  
  const bothPartiesAccepted = application.accepted_jobseeker && application.accepted_business;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isJobSeeker ? "Accept Job Offer" : "Accept Candidate"}
          </DialogTitle>
          <DialogDescription>
            {bothPartiesAccepted
              ? "Both parties have accepted. You can now manage contract details."
              : isJobSeeker
                ? "Accept this job offer to proceed with the agreement."
                : "Accept this candidate to proceed with the agreement."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {bothPartiesAccepted ? (
            <>
              <div className="space-y-4">
                <div className="grid w-full gap-1.5">
                  <label htmlFor="equity" className="text-sm font-medium">
                    Equity Amount (%)
                  </label>
                  <Input
                    id="equity"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={equityAmount}
                    onChange={(e) => setEquityAmount(parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="grid w-full gap-1.5">
                  <label htmlFor="discourse" className="text-sm font-medium">
                    Agreement Notes
                  </label>
                  <Textarea
                    id="discourse"
                    value={discourse}
                    onChange={(e) => setDiscourse(e.target.value)}
                    placeholder="Add notes about the equity agreement..."
                    className="h-24"
                  />
                </div>
                
                <div className="grid w-full gap-1.5">
                  <label htmlFor="contract" className="text-sm font-medium">
                    Upload Contract (PDF)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="contract"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    <Button 
                      size="icon" 
                      onClick={handleUploadContract}
                      disabled={!file || isUploading}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {acceptedJob?.document_url && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="text-sm">Contract document</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(acceptedJob.document_url, "_blank")}
                    >
                      <File className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                {isJobSeeker
                  ? `You're about to accept the job "${application.business_roles?.title}" with ${application.business_roles?.company_name}.`
                  : `You're about to accept the candidate for "${application.business_roles?.title}".`}
              </p>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  Equity allocation
                </span>
                <span>
                  {application.business_roles?.equity_allocation || 0}%
                </span>
              </div>
              
              <p className="text-sm">
                {isJobSeeker
                  ? "Once both you and the business accept, you'll be able to finalize the contract details."
                  : "Once both you and the job seeker accept, you'll be able to finalize the contract details."}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          {bothPartiesAccepted ? (
            <Button onClick={handleUpdateTerms} disabled={isLoading}>
              Update Terms
            </Button>
          ) : (
            <Button onClick={handleAccept} disabled={isLoading || hasAccepted}>
              {hasAccepted 
                ? (isJobSeeker ? "Already Accepted" : "Already Accepted") 
                : (isJobSeeker ? "Accept Job" : "Accept Candidate")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
