
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  const formattedDate = appliedAt 
    ? formatDistanceToNow(new Date(appliedAt), { addSuffix: true })
    : undefined;
    
  return (
    <div className="p-4 space-y-4">
      {description && (
        <div>
          <h4 className="text-sm font-medium mb-1">Role Description</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
      
      {message && (
        <div>
          <h4 className="text-sm font-medium mb-1">Your Message</h4>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      )}
      
      {discourse && (
        <div>
          <h4 className="text-sm font-medium mb-1">Message History</h4>
          <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap">
            {discourse}
          </div>
        </div>
      )}
      
      {formattedDate && (
        <div className="text-xs text-muted-foreground">
          Applied {formattedDate}
        </div>
      )}
      
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
            View Details
          </Button>
        )}
      </div>
    </div>
  );
};
