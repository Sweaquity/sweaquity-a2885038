
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, X, AlertCircle } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { StatusBadge } from "./StatusBadge";
import { ApplicationHeader } from "./ApplicationHeader";
import { ApplicationContent } from "./ApplicationContent";
import { ApplicationSkills } from "./ApplicationSkills";
import { formatDistanceToNow } from "date-fns";

interface PastApplicationItemProps {
  application: JobApplication;
  getMatchedSkills: () => (string | { skill: string; level: string })[];
}

export const PastApplicationItem = ({
  application,
  getMatchedSkills,
}: PastApplicationItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const isRejected = application.status === "rejected";
  const isWithdrawn = application.status === "withdrawn";
  const applicationDate = new Date(application.applied_at);
  
  let statusIcon = isRejected ? 
    <AlertCircle className="h-4 w-4 text-red-500" /> : 
    <X className="h-4 w-4 text-amber-500" />;

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${isExpanded ? "shadow-md" : ""}`}>
      <div className="p-4 cursor-pointer" onClick={handleToggle}>
        <ApplicationHeader
          title={application.business_roles?.title || ""}
          company={application.business_roles?.company_name || ""}
          project={application.business_roles?.project_title || ""}
          status={application.status}
        />
        
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            <span>Applied {formatDistanceToNow(applicationDate, { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-2">
            {statusIcon}
            <StatusBadge status={application.status} />
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <>
          <Separator />
          <CardContent className="p-4 pt-4">
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
                matchedSkills={getMatchedSkills()}
              />
            </div>
            
            {application.notes && (
              <div className="mt-4 p-3 bg-muted/40 rounded-md">
                <h4 className="text-sm font-medium mb-2">
                  {isWithdrawn ? "Withdrawal Reason" : "Rejection Notes"}
                </h4>
                <p className="text-sm">{application.notes}</p>
              </div>
            )}
            
            {application.task_discourse && (
              <div className="mt-4 p-3 bg-muted/40 rounded-md">
                <h4 className="text-sm font-medium mb-2">Message History</h4>
                <p className="text-sm whitespace-pre-wrap">{application.task_discourse}</p>
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
};
