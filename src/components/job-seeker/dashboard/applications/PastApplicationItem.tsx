
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, File, ChevronDown, ChevronRight } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { StatusBadge } from "./StatusBadge";
import { ApplicationHeader } from "./ApplicationHeader";
import { ApplicationContent } from "./ApplicationContent";
import { ApplicationSkills } from "./ApplicationSkills";
import { formatDistanceToNow } from "date-fns";

interface PastApplicationItemProps {
  application: JobApplication;
}

export const PastApplicationItem = ({ application }: PastApplicationItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };
  
  const appliedDate = new Date(application.applied_at);
  const timeAgo = formatDistanceToNow(appliedDate, { addSuffix: true });
  
  // Get the reason for rejection or withdrawal
  const getReason = () => {
    // If there's a specific notes field for rejection/withdrawal reason
    if (application.notes) {
      return application.notes;
    }
    
    // If it was stored in task_discourse (older method)
    if (application.task_discourse) {
      // Try to extract it from the task_discourse
      const regex = /\[(.*?)\](.*?):(.*?)(?:\(Rejection reason\)|\(Withdrawal reason\))/;
      const match = application.task_discourse.match(regex);
      if (match) {
        return match[3].trim();
      }
    }
    
    return "No reason provided";
  };

  return (
    <Card className="overflow-hidden transition-all duration-200">
      <div className="p-4 cursor-pointer" onClick={handleToggle}>
        <ApplicationHeader
          title={application.business_roles?.title || ""}
          company={application.business_roles?.company_name || ""}
          project={application.business_roles?.project_title || ""}
          status={application.status}
        />
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-muted-foreground">
            Applied {timeAgo}
          </div>
          <div className="flex items-center">
            <StatusBadge status={application.status} />
            {isExpanded ? <ChevronDown className="ml-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <>
          <Separator />
          <CardContent className="p-4">
            <ApplicationContent 
              description={application.business_roles?.description || ""}
              timeframe={application.business_roles?.timeframe || ""}
              equityAllocation={application.business_roles?.equity_allocation}
              taskStatus={application.business_roles?.task_status || ""}
              completionPercentage={application.business_roles?.completion_percentage || 0}
            />
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Required Skills</h4>
              <ApplicationSkills
                requiredSkills={application.business_roles?.skill_requirements || []}
                matchedSkills={[]}
              />
            </div>
            
            <div className="mt-4 p-3 bg-muted/40 rounded-md">
              <h4 className="text-sm font-medium mb-2">
                {application.status.toLowerCase() === 'rejected' ? 'Rejection Reason' : 'Withdrawal Reason'}
              </h4>
              <p className="text-sm whitespace-pre-wrap">{getReason()}</p>
            </div>
            
            <div className="flex gap-2 mt-4">
              {application.cv_url && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a href={application.cv_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <File className="mr-1 h-4 w-4" />
                    View CV
                  </a>
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                asChild
              >
                <a href={`/projects/${application.project_id}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="mr-1 h-4 w-4" />
                  View Project
                </a>
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};
