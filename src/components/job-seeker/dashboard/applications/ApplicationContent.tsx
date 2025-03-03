
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export interface ApplicationContentProps {
  description: string;
  message: string;
  discourse?: string;
  appliedAt: string;
}

export const ApplicationContent = ({ description, message, discourse, appliedAt }: ApplicationContentProps) => {
  const timeAgo = formatDistanceToNow(new Date(appliedAt), { addSuffix: true });

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-1">Role Description</h4>
        <p className="text-sm text-muted-foreground">{description || "No description provided."}</p>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-1">Your Application Message</h4>
        <p className="text-sm text-muted-foreground">{message || "No message provided."}</p>
      </div>
      
      {discourse && (
        <div>
          <h4 className="text-sm font-medium mb-1">Message History</h4>
          <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap">
            {discourse}
          </div>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        Applied {timeAgo}
      </div>
    </div>
  );
};
