
import { JobApplication } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronDown, ChevronRight, FileText, Loader2, X } from "lucide-react";
import { ApplicationSkills } from "./ApplicationSkills";
import { format } from "date-fns";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface ApplicationItemProps {
  application: JobApplication;
  getMatchedSkills?: (application: JobApplication) => string[];
  onApplicationUpdated?: () => void;
  isExpanded?: boolean;
  toggleExpanded?: () => void;
}

export const ApplicationItem = ({ 
  application, 
  getMatchedSkills = () => [],
  onApplicationUpdated,
  isExpanded = false,
  toggleExpanded = () => {},
}: ApplicationItemProps) => {
  const { isWithdrawing, handleWithdraw, openCV } = useApplicationActions(onApplicationUpdated);
  const [expanded, setExpanded] = useState(isExpanded);
  
  const handleToggle = () => {
    if (toggleExpanded) {
      toggleExpanded();
    } else {
      setExpanded(!expanded);
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'in review':
      case 'negotiation':
        return 'secondary';
      case 'rejected':
      case 'withdrawn':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const matchedSkills = getMatchedSkills(application);
  const showExpanded = isExpanded !== undefined ? isExpanded : expanded;
  
  // Extract skills from business_roles for display
  const roleSkills = application.business_roles?.skills_required || [];

  return (
    <Collapsible 
      open={showExpanded} 
      onOpenChange={handleToggle}
      className="border rounded-md overflow-hidden"
    >
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center p-4 hover:bg-muted/50 cursor-pointer">
          <div className="flex-1 mr-4">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">{application.business_roles?.title || 'Untitled Role'}</h3>
              <Badge variant={getStatusBadgeVariant(application.status)}>
                {application.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {application.business_roles?.company_name || 'Unknown Company'}
              {application.business_roles?.project_title && ` • ${application.business_roles.project_title}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {format(new Date(application.applied_at), 'MMM d, yyyy')}
            </span>
            {showExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="p-4 border-t bg-muted/20">
        <div className="space-y-4">
          {/* Application details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Role Details</h4>
              <p className="text-sm">{application.business_roles?.description || 'No description provided.'}</p>
              
              {application.business_roles?.timeframe && (
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  <span>Timeframe: {application.business_roles.timeframe}</span>
                </div>
              )}
              
              {application.business_roles?.equity_allocation && (
                <p className="text-sm font-medium mt-2">
                  {application.business_roles.equity_allocation}% Equity
                </p>
              )}
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Your Application</h4>
              <p className="text-sm">{application.message || 'No cover message provided.'}</p>
              
              {application.cv_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => openCV(application.cv_url!)}
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  View Submitted CV
                </Button>
              )}
            </div>
          </div>
          
          {/* Skills section */}
          <div>
            <h4 className="text-sm font-medium mb-1">Required Skills</h4>
            <ApplicationSkills
              roleSkills={roleSkills}
              matchedSkills={matchedSkills}
              displayEmpty={true}
            />
          </div>
          
          {/* Actions */}
          {application.status !== 'withdrawn' && application.status !== 'rejected' && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                disabled={isWithdrawing === application.job_app_id}
                onClick={() => handleWithdraw(application.job_app_id)}
              >
                {isWithdrawing === application.job_app_id ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5 mr-1.5" />
                )}
                Withdraw Application
              </Button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
