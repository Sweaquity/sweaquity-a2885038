
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Calendar, ChevronDown, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { JobApplication, EquityProject } from "@/types/jobSeeker";
import { AcceptJobDialog } from "./AcceptJobDialog";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface EquityProjectItemProps {
  application: JobApplication;
  onApplicationUpdated: () => void;
}

export const EquityProjectItem = ({ application, onApplicationUpdated }: EquityProjectItemProps) => {
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const { updateApplicationStatus } = useApplicationActions(onApplicationUpdated);
  const { 
    acceptJobAsJobSeeker, 
    isLoading: isAcceptLoading,
    getAcceptedJob 
  } = useAcceptedJobs(onApplicationUpdated);

  const [contractUrl, setContractUrl] = useState<string | null>(null);

  // Load contract if accepted
  const loadAcceptedJobData = async () => {
    if (application.job_app_id && application.status === 'accepted') {
      const acceptedJob = await getAcceptedJob(application.job_app_id);
      if (acceptedJob?.document_url) {
        setContractUrl(acceptedJob.document_url);
      }
    }
  };

  // Call on component mount
  useEffect(() => {
    loadAcceptedJobData();
  }, [application.job_app_id, application.status]);

  // Format date to readable string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!application.job_app_id) return;
    
    setIsUpdating(true);
    try {
      await updateApplicationStatus(application.job_app_id, newStatus);
      toast.success(`Application status updated to ${newStatus}`);
      onApplicationUpdated();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update application status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewProject = () => {
    if (application.project_id) {
      navigate(`/projects/${application.project_id}`);
    }
  };

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle accepting job and refreshing data
  const handleAcceptJob = async (): Promise<void> => {
    onApplicationUpdated();
    await loadAcceptedJobData();
    return Promise.resolve();
  };

  const companyName = application.business_roles?.company_name || "Unknown Company";
  const projectTitle = application.business_roles?.project_title || "Unknown Project";
  const roleName = application.business_roles?.title || "Unknown Role";
  const equityAllocation = application.business_roles?.equity_allocation || 0;
  const timeframe = application.business_roles?.timeframe || "Not specified";

  const showAcceptButton = 
    application.status === 'accepted' && 
    application.accepted_business &&
    !application.accepted_jobseeker;

  return (
    <Card className="overflow-hidden border-l-4 border-l-green-500">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary/10">
              <AvatarFallback>{getInitials(companyName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{roleName}</h3>
              <p className="text-sm text-muted-foreground">{companyName} - {projectTitle}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewProject}>
                View Project
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange('withdrawn')}
                className="text-destructive"
                disabled={isUpdating}
              >
                Withdraw Application
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-xs text-muted-foreground">Equity</p>
            <p className="font-medium">{equityAllocation}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Timeframe</p>
            <p className="font-medium">{timeframe}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Applied</p>
            <p className="font-medium">{formatDate(application.applied_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={application.status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isUpdating} className="h-6 w-6 p-0">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleStatusChange('withdrawn')}>
                    Withdraw
                  </DropdownMenuItem>
                  {application.accepted_business && (
                    <DropdownMenuItem onClick={() => setShowAcceptDialog(true)}>
                      Accept Job Offer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        {showAcceptButton && (
          <Button 
            className="w-full" 
            onClick={() => setShowAcceptDialog(true)}
            disabled={isAcceptLoading}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept Job Offer
          </Button>
        )}
        
        {application.accepted_jobseeker && application.accepted_business && (
          <>
            {contractUrl ? (
              <a 
                href={contractUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Contract
                </Button>
              </a>
            ) : (
              <Button disabled variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Contract Pending
              </Button>
            )}
          </>
        )}
      </CardFooter>

      {/* Accept Job Dialog */}
      <AcceptJobDialog
        isOpen={showAcceptDialog}
        onOpenChange={setShowAcceptDialog}
        application={application}
        onAccept={handleAcceptJob}
      />
    </Card>
  );
};
