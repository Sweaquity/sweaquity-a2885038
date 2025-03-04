
import { Card } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WithdrawDialog } from "./WithdrawDialog";
import { useWithdrawApplication } from "./hooks/useWithdrawApplication";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";

interface PendingApplicationItemProps {
  application: JobApplication;
  getMatchedSkills: () => string[];
  onApplicationUpdated?: () => void;
}

export const PendingApplicationItem = ({ 
  application, 
  getMatchedSkills,
  onApplicationUpdated 
}: PendingApplicationItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isWithdrawDialogOpen,
    setIsWithdrawDialogOpen,
    isWithdrawing,
    handleWithdrawApplication
  } = useWithdrawApplication(onApplicationUpdated);

  const matchedSkills = getMatchedSkills();
  const appliedDate = new Date(application.applied_at);
  const timeAgo = formatDistanceToNow(appliedDate, { addSuffix: true });

  const onWithdraw = async (reason: string) => {
    await handleWithdrawApplication(application.job_app_id, reason);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-lg overflow-hidden"
    >
      <CollapsibleTrigger className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 text-left hover:bg-muted/50 transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium line-clamp-1">
                {application.business_roles?.title || "Unknown Role"}
              </h3>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {application.business_roles?.company_name || "Unknown Company"} • 
              {application.business_roles?.project_title && ` ${application.business_roles.project_title}`}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {(application.business_roles?.skill_requirements || []).slice(0, 2).map((skill, index) => {
                const skillName = typeof skill === 'string' ? skill : skill.skill;
                return (
                  <Badge 
                    key={index} 
                    variant={matchedSkills.includes(skillName) ? "default" : "outline"}
                    className="text-xs"
                  >
                    {skillName}
                  </Badge>
                );
              })}
              {(application.business_roles?.skill_requirements || []).length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{(application.business_roles?.skill_requirements || []).length - 2} more
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {application.business_roles?.timeframe && `${application.business_roles.timeframe} • `}
              {application.business_roles?.equity_allocation !== undefined && 
                `${application.business_roles.equity_allocation}% equity`}
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Applied {timeAgo}
            </div>
            <StatusBadge status={application.status} />
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 border-t bg-muted/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Project Description</h4>
              <p className="text-sm">
                {application.business_roles?.description || "No description provided."}
              </p>
              
              <h4 className="font-medium mt-4 mb-2">Your Application Message</h4>
              <p className="text-sm">
                {application.message || "No message provided."}
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {application.cv_url && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(application.cv_url as string, '_blank');
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" /> View CV
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/projects/${application.project_id}`, '_blank');
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> View Project
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsWithdrawDialogOpen(true);
                  }}
                >
                  Withdraw Application
                </Button>
              </div>
              
              <div className="mt-auto space-y-2">
                <h4 className="font-medium">Status Updates</h4>
                <p className="text-sm text-muted-foreground">
                  The business will review your application and update its status.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
      
      <WithdrawDialog
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        onWithdraw={onWithdraw}
        isWithdrawing={isWithdrawing}
      />
    </Collapsible>
  );
};
