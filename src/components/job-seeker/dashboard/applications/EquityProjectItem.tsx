
import { Card } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { CreateMessageDialog } from "./CreateMessageDialog";
import { Progress } from "@/components/ui/progress";

interface EquityProjectItemProps {
  application: JobApplication;
  getMatchedSkills: () => string[];
  onApplicationUpdated?: () => void;
}

export const EquityProjectItem = ({ 
  application, 
  getMatchedSkills,
  onApplicationUpdated 
}: EquityProjectItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  const matchedSkills = getMatchedSkills();
  const appliedDate = new Date(application.applied_at);
  const timeAgo = formatDistanceToNow(appliedDate, { addSuffix: true });
  const completionPercentage = application.business_roles?.completion_percentage || 0;

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
              {(application.business_roles?.skill_requirements || []).slice(0, 2).map((skill, index) => (
                <Badge 
                  key={index} 
                  variant={matchedSkills.includes(typeof skill === 'string' ? skill : skill.skill) ? "default" : "outline"}
                  className="text-xs"
                >
                  {typeof skill === 'string' ? skill : skill.skill}
                </Badge>
              ))}
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
          
          <div className="flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Started {timeAgo}
              </div>
              <StatusBadge status={application.status} />
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
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
              
              <h4 className="font-medium mt-4 mb-2">Task Description</h4>
              <p className="text-sm">
                {application.business_roles?.description || "No description provided."}
              </p>
              
              <h4 className="font-medium mt-4 mb-2">Discourse</h4>
              <div className="text-sm bg-muted/20 p-2 rounded-md max-h-32 overflow-y-auto">
                {application.task_discourse ? (
                  <div dangerouslySetInnerHTML={{ __html: application.task_discourse.replace(/\n/g, '<br>') }} />
                ) : (
                  <p className="text-muted-foreground">No messages yet</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
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
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMessageDialogOpen(true);
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Create Message
                </Button>
              </div>
              
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Status Information</h4>
                {application.status === 'negotiation' ? (
                  <p className="text-sm text-muted-foreground">
                    You're currently negotiating terms for this project.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You've been accepted to work on this project. Track your progress and communicate with the business owner.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
      
      <CreateMessageDialog
        isOpen={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        applicationId={application.job_app_id}
        onMessageSent={onApplicationUpdated}
      />
    </Collapsible>
  );
};
