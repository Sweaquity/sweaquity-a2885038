
import { useState } from 'react';
import { JobApplication } from '@/types/jobSeeker';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronDown, ChevronUp, Calendar, Building } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ApplicationStatus } from './components';

interface PastApplicationItemProps {
  application: JobApplication;
  onApplicationUpdated?: () => void;
  compact?: boolean;
}

export const PastApplicationItem = ({ 
  application, 
  onApplicationUpdated,
  compact = false 
}: PastApplicationItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Format the application date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="mb-4 border shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold">
              {application.business_roles?.title || 'Untitled Role'}
            </h3>
            <ApplicationStatus 
              status={application.status} 
              isExpanded={isExpanded}
              toggleExpand={toggleExpand}
              onStatusChange={() => {}} 
              isUpdatingStatus={false}
              showAcceptButton={false}
              onAcceptClick={() => {}}
              isAcceptingJob={false}
              compact={compact}
            />
          </div>
          
          <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            {application.business_roles?.company_name && (
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                {application.business_roles.company_name}
              </span>
            )}
            
            {application.applied_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Applied: {formatDate(application.applied_at)}
              </span>
            )}
            
            {application.updated_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Updated: {formatDate(application.updated_at)}
              </span>
            )}
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={toggleExpand} className="ml-auto">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-2 px-4 pb-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">
                {application.business_roles?.description || 'No description provided.'}
              </p>
            </div>
            
            {application.message && (
              <div>
                <h4 className="text-sm font-medium mb-1">Your Message</h4>
                <p className="text-sm text-muted-foreground">{application.message}</p>
              </div>
            )}
            
            {application.task_discourse && (
              <div>
                <h4 className="text-sm font-medium mb-1">Communication</h4>
                <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-line max-h-40 overflow-y-auto">
                  {application.task_discourse}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
