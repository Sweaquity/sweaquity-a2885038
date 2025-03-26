
import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Application } from "@/types/business";
import { ChevronDown, ChevronRight, Bell, CheckCircle, FileText, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAcceptedJobsCore, AcceptedJob } from "@/hooks/jobs/useAcceptedJobsCore";
import { ExpandedApplicationContent } from "./ExpandedApplicationContent";
import { previewApplicationCV } from "@/utils/setupStorage";

interface ApplicationCardProps {
  application: Application;
  isExpanded: boolean;
  toggleExpand: () => void;
  openAcceptJobDialog: (application: Application) => void;
  handleStatusChange: (applicationId: string, newStatus: string) => Promise<void>;
}

export const ApplicationCard = ({
  application,
  isExpanded,
  toggleExpand,
  openAcceptJobDialog,
  handleStatusChange
}: ApplicationCardProps) => {
  const [acceptedJob, setAcceptedJob] = useState<AcceptedJob | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const { getAcceptedJob } = useAcceptedJobsCore(() => {
    loadAcceptedJob();
  });
  
  const loadAcceptedJob = async () => {
    if (application.accepted_business && application.accepted_jobseeker) {
      const jobData = await getAcceptedJob(application.job_app_id);
      setAcceptedJob(jobData);
    }
  };
  
  useEffect(() => {
    if (isExpanded) {
      loadAcceptedJob();
    }
  }, [isExpanded, application.accepted_business, application.accepted_jobseeker]);
  
  // Check if CV exists and is from the job_applications bucket
  const hasCvInJobApplicationsBucket = application.cv_url && 
    (application.cv_url.includes('job_applications/') || application.cv_url.includes('job-applications/'));
  
  // Handle CV download safely
  const handleCvDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (application.cv_url) {
      previewApplicationCV(application.cv_url);
    }
  };

  // Handle status change with loading state
  const onStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    setIsUpdatingStatus(application.job_app_id);
    try {
      await handleStatusChange(application.job_app_id, e.target.value);
    } finally {
      setIsUpdatingStatus(null);
    }
  };
  
  return (
    <Card className="shadow-sm hover:shadow transition-shadow">
      <Collapsible open={isExpanded} onOpenChange={toggleExpand}>
        <CardHeader className="p-4 pb-3">
          {/* Two-row grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            {/* First row */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Applicant:</span>
              <span>{application.profile?.first_name} {application.profile?.last_name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Role:</span>
              <span>{application.business_roles?.title || "Untitled Role"}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Description:</span>
              <span className="truncate">{application.business_roles?.description || "No description"}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Equity:</span>
              <span>{application.business_roles?.equity_allocation ? `${application.business_roles.equity_allocation}%` : "N/A"}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Status:</span>
              <div className="flex items-center">
                <select 
                  className="px-2 py-1 border rounded text-sm bg-white"
                  value={application.status || "pending"}
                  onChange={onStatusChange}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isUpdatingStatus === application.job_app_id}
                >
                  <option value="negotiation">Negotiation</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                {isUpdatingStatus === application.job_app_id && (
                  <Loader2 className="animate-spin ml-2 h-4 w-4" />
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Jobseeker Accepted:</span>
              <span>{application.accepted_jobseeker ? "Yes" : "No"}</span>
            </div>

            {/* Only show CV download button if CV exists in job_applications bucket */}
            {hasCvInJobApplicationsBucket && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCvDownload}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Download Application CV
                </Button>
              </div>
            )}
          </div>
          
          {/* Second row */}
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Skills Required:</span>
              <div className="flex flex-wrap gap-1">
                {application.business_roles?.skill_requirements?.map((skill, index) => (
                  <Badge key={index} variant="outline" className="bg-slate-50">
                    {typeof skill === 'string' ? skill : skill.skill}
                    {typeof skill !== 'string' && skill.level && 
                      <span className="ml-1 opacity-70">({skill.level})</span>
                    }
                  </Badge>
                ))}
                {(!application.business_roles?.skill_requirements || 
                  application.business_roles.skill_requirements.length === 0) && 
                  <span className="text-muted-foreground">No specific skills required</span>
                }
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Timeframe:</span>
              <span>{application.business_roles?.timeframe || "Not specified"}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center">
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Show Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            
            {application.status === 'accepted' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAcceptJobDialog(application);
                      }}
                      disabled={application.accepted_business}
                    >
                      {application.accepted_business ? (
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <Bell className="h-4 w-4 mr-1" />
                      )}
                      {application.accepted_business ? "Accepted" : "Accept Contract"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {application.accepted_business 
                      ? "You have accepted this job contract" 
                      : "Accept job contract and finalize equity agreement"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <ExpandedApplicationContent 
            application={application}
            acceptedJob={acceptedJob}
            onUpdate={loadAcceptedJob}
          />
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
