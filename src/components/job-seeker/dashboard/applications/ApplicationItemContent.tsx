
import React from 'react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, XCircle } from 'lucide-react';

interface ApplicationItemContentProps {
  description?: string;
  message?: string;
  discourse?: string;
  appliedAt?: string;
  onMessageClick: () => void;
  onWithdrawClick: () => void;
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
    if (!dateString) return 'Recently';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="px-4 py-3 border-t">
      {description && (
        <div className="mb-3">
          <h4 className="text-sm font-medium mb-1">Position Description:</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
      
      {message && (
        <div className="mb-3">
          <h4 className="text-sm font-medium mb-1">Your Message:</h4>
          <p className="text-sm bg-muted/50 p-2 rounded">{message}</p>
        </div>
      )}
      
      {discourse && (
        <div className="mb-3">
          <h4 className="text-sm font-medium mb-1">Conversation:</h4>
          <div className="text-sm bg-muted/50 p-2 rounded whitespace-pre-line max-h-32 overflow-y-auto">
            {discourse}
          </div>
        </div>
      )}
      
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Applied {formatDate(appliedAt)}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onMessageClick}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            Message
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="text-destructive" 
            onClick={onWithdrawClick}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  );
};
