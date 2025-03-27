
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Mail, ExternalLink } from 'lucide-react';
import { ApplicationContent } from '../ApplicationContent';

interface ApplicationItemContentProps {
  description?: string;
  message?: string;
  discourse?: string;
  appliedAt?: string;
  onViewDetails?: () => void;
  onSendMessage?: () => void;
  onWithdrawClick?: () => void;
  onViewProject?: () => void;
}

export const ApplicationItemContent = ({
  description,
  message,
  discourse,
  appliedAt,
  onViewDetails,
  onSendMessage,
  onWithdrawClick,
  onViewProject
}: ApplicationItemContentProps) => {
  return (
    <div className="space-y-4">
      <ApplicationContent 
        description={description}
        message={message}
        appliedAt={appliedAt}
        discourse={discourse}
      />
      
      <div className="flex justify-end space-x-2">
        {onWithdrawClick && (
          <Button variant="destructive" size="sm" onClick={onWithdrawClick}>
            Withdraw
          </Button>
        )}
        {onSendMessage && (
          <Button variant="outline" size="sm" onClick={onSendMessage}>
            <Mail className="h-4 w-4 mr-1" />
            Send Message
          </Button>
        )}
        {onViewProject && (
          <Button variant="outline" size="sm" onClick={onViewProject}>
            <ExternalLink className="h-4 w-4 mr-1" />
            View Project
          </Button>
        )}
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        )}
      </div>
    </div>
  );
};
