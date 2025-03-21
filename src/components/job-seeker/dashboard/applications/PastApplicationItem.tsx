
import { useState } from "react";
import { JobApplication } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ApplicationStatus } from "./components/ApplicationStatus";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PastApplicationItemProps {
  application: JobApplication;
}

export const PastApplicationItem = ({ application }: PastApplicationItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper functions to safely access nested properties
  const getTaskStatus = () => {
    return application.business_roles?.task_status || 'pending';
  };

  const getCompletionPercentage = () => {
    return application.business_roles?.completion_percentage || 0;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">{application.business_roles?.title || 'Untitled Role'}</h3>
              <ApplicationStatus status={application.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {application.business_roles?.company_name || 'Unknown Company'} {application.business_roles?.project_title && `• ${application.business_roles.project_title}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Applied on {formatDate(application.applied_at)}
            </p>
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CardContent className="px-4 py-2">
          <div className="text-sm flex flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className="text-xs font-normal">
                {getTaskStatus()}
              </Badge>
            </div>
            
            {application.business_roles?.timeframe && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Timeframe:</span>
                <span>{application.business_roles.timeframe}</span>
              </div>
            )}
            
            {application.business_roles?.equity_allocation && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Equity:</span>
                <span>{application.business_roles.equity_allocation}%</span>
              </div>
            )}
          </div>
          
          <CollapsibleContent className="mt-4 space-y-4">
            {application.business_roles?.description && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">{application.business_roles.description}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <h4 className="font-medium">Completion</h4>
                <span>{getCompletionPercentage()}%</span>
              </div>
              <Progress value={getCompletionPercentage()} className="h-2" />
            </div>
            
            {application.message && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Your Application Message</h4>
                <p className="text-sm text-muted-foreground">{application.message}</p>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
