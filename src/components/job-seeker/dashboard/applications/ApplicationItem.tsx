import React, { useState } from 'react';
import { JobApplication } from '@/types/interfaces';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MessageSquare } from "lucide-react";
import { Collapsible } from "@/components/ui/collapsible"
import { CollapsibleContent } from "@/components/ui/collapsible"
import { ApplicationItemContent } from './ApplicationItemContent';

interface ApplicationItemProps {
  application: JobApplication;
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return "secondary";
    case 'accepted':
      return "default";
    case 'rejected':
      return "destructive";
    case 'withdrawn':
      return "outline";
    default:
      return "secondary";
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'N/A';
  }
};

export const ApplicationItem: React.FC<ApplicationItemProps> = ({ application, onWithdraw }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-md shadow-sm bg-card text-card-foreground">
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-lg">{application.task_title || 'Task'}</h3>
          <p className="text-muted-foreground text-sm">{application.company_name || 'Company'} - {application.project_title || application.project_id || 'Project'}</p>
          <div className="flex items-center gap-1 mt-1">
            <Badge 
              variant={getStatusVariant(application.status || '')}
            >
              {application.status}
            </Badge>
            <Badge variant="outline">
              Applied: {formatDate(application.applied_at || '')}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="ghost" size="sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            View Task
          </Button>
        </div>
      </div>

      <Collapsible
        open={isExpanded}
        onOpenChange={setIsExpanded}
        className="w-full"
      >
        <CollapsibleContent className="px-4 pt-2 pb-4">
          <ApplicationItemContent 
            description={application.description || ''}
            message={application.message || ''} 
            discourse={application.task_discourse || ''} 
            appliedAt={application.applied_at || ''}
            onMessageClick={() => {}}
            onWithdrawClick={() => onWithdraw?.(application.id || application.job_app_id || '', '')}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
