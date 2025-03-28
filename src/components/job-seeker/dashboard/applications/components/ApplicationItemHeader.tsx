
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { JobApplication } from '@/types/jobSeeker';
import { StatusBadge } from '../StatusBadge';
import { formatDistanceToNow } from 'date-fns';

export interface ApplicationItemHeaderProps {
  title: string;
  company: string;
  project: string;
  status: string;
  isExpanded: boolean;
  toggleExpand: () => void;
  onStatusChange?: (status: string) => void;
  isUpdatingStatus?: boolean;
  showAcceptButton?: boolean;
  onAcceptClick?: () => void;
  isAcceptingJob?: boolean;
  compact?: boolean;
  date?: string;
  application?: JobApplication;
}

export const ApplicationItemHeader = ({
  title,
  company,
  project,
  status,
  isExpanded,
  toggleExpand,
  onStatusChange,
  isUpdatingStatus,
  showAcceptButton,
  onAcceptClick,
  isAcceptingJob,
  compact = false,
  date
}: ApplicationItemHeaderProps) => {
  const formattedDate = date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : undefined;
  
  return (
    <div
      className={`p-4 flex items-center justify-between cursor-pointer ${compact ? 'sm:text-sm' : ''}`}
      onClick={toggleExpand}
    >
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className={`font-medium ${compact ? 'text-base' : 'text-lg'}`}>
              {title || "Task"}
            </h4>
            <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
              {company || 'Company'} • {project || 'Project'}
            </p>
            {formattedDate && (
              <p className="text-xs text-muted-foreground">
                Applied {formattedDate}
              </p>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        {showAcceptButton && (
          <Button 
            size="sm" 
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              if (onAcceptClick) onAcceptClick();
            }}
            disabled={isAcceptingJob}
          >
            {isAcceptingJob ? "Accepting..." : "Accept Job"}
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand();
          }}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Expand
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
