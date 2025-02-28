
import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobApplication } from "@/types/jobSeeker";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { ApplicationSkills } from "./ApplicationSkills";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ApplicationItemProps {
  application: JobApplication;
  onApplicationUpdated: () => void;
}

export const ApplicationItem = ({ application, onApplicationUpdated }: ApplicationItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isWithdrawing, handleWithdraw, openCV } = useApplicationActions(onApplicationUpdated);
  
  const titleText = application.business_roles?.title || "Untitled Role";
  const companyText = application.business_roles?.company_name || "Unknown Company";
  const projectText = application.business_roles?.project_title || "Unknown Project";
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'secondary';
      case 'in review': return 'default';
      case 'negotiation': return 'default';
      case 'accepted': return 'success';
      case 'rejected': 
      case 'withdrawn': 
        return 'destructive';
      default: return 'outline';
    }
  };
  
  const formattedDate = application.applied_at 
    ? format(new Date(application.applied_at), 'MMM d, yyyy')
    : 'Unknown date';
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-lg overflow-hidden bg-card"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-accent/50 transition-colors">
        <div className="flex items-center space-x-4">
          <div>
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{titleText}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {companyText} • {projectText}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Badge variant={getStatusBadgeVariant(application.status)}>
            {application.status}
          </Badge>
          <span className="text-xs text-muted-foreground ml-4 hidden sm:inline">
            {formattedDate}
          </span>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-4 pb-4 pt-0">
        <div className="space-y-4 pl-9">
          {application.message && (
            <div>
              <h4 className="text-sm font-medium mb-1">Application Message:</h4>
              <p className="text-sm whitespace-pre-wrap">{application.message}</p>
            </div>
          )}
          
          <ApplicationSkills 
            roleSkills={application.business_roles?.skills_required || []} 
          />
          
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex space-x-2">
              {application.cv_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCV(application.cv_url || '')}
                  className="flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View CV
                </Button>
              )}
              
              {application.status !== 'withdrawn' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleWithdraw(application.job_app_id)}
                  disabled={!!isWithdrawing}
                >
                  {isWithdrawing === application.job_app_id ? 
                    'Withdrawing...' : 
                    'Withdraw Application'
                  }
                </Button>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Applied on {formattedDate}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
