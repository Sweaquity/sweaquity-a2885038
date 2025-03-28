
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ApplicationStatusProps {
  status: string;
  isExpanded: boolean;
  toggleExpand: () => void;
  onStatusChange?: (status: string) => void;
  isUpdatingStatus?: boolean;
  showAcceptButton?: boolean;
  onAcceptClick?: () => void;
  isAcceptingJob?: boolean;
  compact?: boolean;
}

export const ApplicationStatus = ({
  status,
  isExpanded,
  toggleExpand,
  onStatusChange,
  isUpdatingStatus,
  showAcceptButton,
  onAcceptClick,
  isAcceptingJob,
  compact = false
}: ApplicationStatusProps) => {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'accepted' || statusLower === 'completed') return 'bg-green-500';
    if (statusLower === 'rejected') return 'bg-red-500';
    if (statusLower === 'withdrawn') return 'bg-yellow-500';
    if (statusLower === 'pending') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={`${getStatusColor(status)}`} variant="secondary">
        {status}
      </Badge>
      
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
            {!compact && "Collapse"}
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            {!compact && "Expand"}
          </>
        )}
      </Button>
    </div>
  );
};
