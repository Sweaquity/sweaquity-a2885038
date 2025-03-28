
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MessageCircle, XCircle } from 'lucide-react';

export interface ApplicationItemContentProps {
  description?: string;
  message?: string;
  discourse?: string;
  appliedAt?: string;
  onMessageClick?: () => void;
  onWithdrawClick?: () => void;
}

export const ApplicationItemContent: React.FC<ApplicationItemContentProps> = ({
  description,
  message,
  discourse,
  appliedAt,
  onMessageClick,
  onWithdrawClick
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  return (
    <div className="p-4 pt-0 space-y-3">
      {description && (
        <div>
          <h4 className="text-sm font-medium">Job Description:</h4>
          <p className="text-sm mt-1">{description}</p>
        </div>
      )}
      
      {message && (
        <div>
          <h4 className="text-sm font-medium">Your Message:</h4>
          <p className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded-md mt-1">{message}</p>
        </div>
      )}
      
      {discourse && (
        <div>
          <h4 className="text-sm font-medium">Conversation History:</h4>
          <div className="bg-gray-50 p-2 rounded-md mt-1 max-h-40 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap">{discourse}</pre>
          </div>
        </div>
      )}
      
      {appliedAt && (
        <div className="text-xs text-muted-foreground">
          Applied {formatDate(appliedAt)}
        </div>
      )}
      
      <div className="flex space-x-2 pt-2">
        {onMessageClick && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onMessageClick}
            className="flex items-center space-x-1"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Send Message</span>
          </Button>
        )}
        
        {onWithdrawClick && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onWithdrawClick}
            className="flex items-center text-destructive hover:text-destructive space-x-1"
          >
            <XCircle className="h-4 w-4" />
            <span>Withdraw</span>
          </Button>
        )}
      </div>
    </div>
  );
};
