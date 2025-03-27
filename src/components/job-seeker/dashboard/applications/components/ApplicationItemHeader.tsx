
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ApplicationHeader } from '../ApplicationHeader';

interface ApplicationItemHeaderProps {
  title?: string;
  company?: string;
  project?: string;
  status?: string;
  date?: string;
  showStatus?: boolean;
}

export const ApplicationItemHeader = ({ 
  title, 
  company, 
  project, 
  status,
  date,
  showStatus = true
}: ApplicationItemHeaderProps) => {
  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return "outline";
    
    switch(status.toLowerCase()) {
      case 'accepted':
        return "success";
      case 'rejected':
        return "destructive";
      case 'withdrawn':
        return "warning";
      case 'completed':
        return "info";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex justify-between items-start">
      <ApplicationHeader 
        title={title}
        company={company}
        project={project}
        status={status}
      />
      
      <div className="flex flex-col items-end">
        {showStatus && status && (
          <Badge variant={getStatusBadgeVariant(status)}>
            {status}
          </Badge>
        )}
        {date && <span className="text-xs text-muted-foreground mt-1">{date}</span>}
      </div>
    </div>
  );
};
