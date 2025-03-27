
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Mail, ExternalLink } from 'lucide-react';
import { ApplicationItemContentProps } from '@/types/types';

export const ApplicationItemContent: React.FC<ApplicationItemContentProps> = ({
  description,
  message,
  discourse,
  appliedAt,
  onMessageClick,
  onWithdrawClick
}) => {
  return (
    <div className="space-y-4">
      <div>
        {description && (
          <div className="mb-2">
            <h4 className="text-sm font-medium">Project Description</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}
        
        {message && (
          <div className="mb-2">
            <h4 className="text-sm font-medium">Your Message</h4>
            <p className="text-sm italic text-muted-foreground">{message}</p>
          </div>
        )}
        
        {discourse && (
          <div className="mb-2">
            <h4 className="text-sm font-medium">Task Discussion</h4>
            <p className="text-sm text-muted-foreground">{discourse}</p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Applied: {new Date(appliedAt).toLocaleDateString()}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        {onWithdrawClick && (
          <Button variant="destructive" size="sm" onClick={onWithdrawClick}>
            Withdraw
          </Button>
        )}
        {onMessageClick && (
          <Button variant="outline" size="sm" onClick={onMessageClick}>
            <Mail className="h-4 w-4 mr-1" />
            Send Message
          </Button>
        )}
      </div>
    </div>
  );
};
