
import { JobApplication } from "@/types/jobSeeker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "./StatusBadge";

interface PastApplicationItemProps {
  application: JobApplication;
  getMatchedSkills: () => string[];
}

export const PastApplicationItem = ({ 
  application, 
  getMatchedSkills
}: PastApplicationItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const matchedSkills = getMatchedSkills();
  const appliedDate = new Date(application.applied_at);
  const timeAgo = formatDistanceToNow(appliedDate, { addSuffix: true });

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
              Applied {timeAgo}
            </p>
          </div>
          
          <div className="flex justify-end">
            <StatusBadge status={application.status} />
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 border-t bg-muted/10">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Task Description</h4>
              <p className="text-sm">
                {application.business_roles?.description || "No description provided."}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Your Application Message</h4>
              <p className="text-sm">
                {application.message || "No message provided."}
              </p>
            </div>
            
            {application.notes && (
              <div>
                <h4 className="font-medium mb-2">
                  {application.status === 'withdrawn' ? 'Withdrawal Reason' : 'Rejection Reason'}
                </h4>
                <p className="text-sm">
                  {application.notes}
                </p>
              </div>
            )}
            
            {application.task_discourse && (
              <div>
                <h4 className="font-medium mb-2">Previous Messages</h4>
                <div className="text-sm bg-muted/20 p-2 rounded-md max-h-32 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: application.task_discourse.replace(/\n/g, '<br>') }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
