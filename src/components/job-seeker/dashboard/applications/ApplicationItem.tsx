
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobApplication } from "@/types/jobSeeker";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { ApplicationSkills } from "./ApplicationSkills";

interface ApplicationItemProps {
  application: JobApplication;
  onApplicationUpdated: () => void;
}

export const ApplicationItem = ({
  application,
  onApplicationUpdated,
}: ApplicationItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const { isWithdrawing, handleWithdraw, openCV } = useApplicationActions(onApplicationUpdated);
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'bg-green-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'withdrawn':
        return 'bg-gray-500 text-white';
      case 'in review':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-200';
    }
  };

  const isWithdrawable = application.status.toLowerCase() === 'pending';
  
  const formattedDate = new Date(application.applied_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
          <div className="space-y-1 mb-2 sm:mb-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="font-medium">
                {application.business_roles?.title || "Unknown Role"}
              </h3>
              <Badge 
                className={`${getStatusColor(application.status)} px-2 py-0.5 text-xs capitalize w-fit`}
              >
                {application.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {application.business_roles?.project_title || "Unknown Project"} • Applied {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isWithdrawable && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleWithdraw(application.job_app_id)}
                disabled={Boolean(isWithdrawing)}
              >
                {isWithdrawing === application.job_app_id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw'
                )}
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="ml-auto"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t pt-4 space-y-4">
            {application.message && (
              <div>
                <h4 className="text-sm font-medium mb-1">Your Application Message:</h4>
                <p className="text-sm text-muted-foreground">{application.message}</p>
              </div>
            )}
            
            {application.business_roles?.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Role Description:</h4>
                <p className="text-sm text-muted-foreground">{application.business_roles.description}</p>
              </div>
            )}
            
            {application.business_roles?.skills_required && (
              <div>
                <h4 className="text-sm font-medium mb-1">Required Skills:</h4>
                <ApplicationSkills 
                  requiredSkills={application.business_roles.skills_required} 
                />
              </div>
            )}
            
            {application.cv_url && (
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openCV(application.cv_url as string)}
                >
                  View CV
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
