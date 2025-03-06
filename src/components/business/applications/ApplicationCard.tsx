
import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Application } from "@/types/business";
import { ChevronDown, ChevronRight, Bell, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAcceptedJobsCore, AcceptedJob } from "@/hooks/jobs/useAcceptedJobsCore";
import { ExpandedApplicationContent } from "./ExpandedApplicationContent";

interface ApplicationCardProps {
  application: Application;
  isExpanded: boolean;
  toggleExpand: () => void;
  openAcceptJobDialog: (application: Application) => void;
}

export const ApplicationCard = ({
  application,
  isExpanded,
  toggleExpand,
  openAcceptJobDialog
}: ApplicationCardProps) => {
  const [acceptedJob, setAcceptedJob] = useState<AcceptedJob | null>(null);
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
              <Badge className={
                application.status.toLowerCase() === 'accepted' 
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }>
                {application.status}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Jobseeker Accepted:</span>
              <span>{application.accepted_jobseeker ? "Yes" : "No"}</span>
            </div>
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
