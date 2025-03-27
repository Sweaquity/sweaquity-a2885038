
import React from 'react';

interface ApplicationContentProps {
  description?: string;
  message?: string;
  discourse?: string;
  appliedAt?: string;
}

export const ApplicationContent: React.FC<ApplicationContentProps> = ({
  description,
  message,
  discourse,
  appliedAt
}) => {
  return (
    <div className="space-y-3">
      {description && (
        <div>
          <h4 className="text-sm font-medium">Project Description</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
      
      {message && (
        <div>
          <h4 className="text-sm font-medium">Your Message</h4>
          <p className="text-sm italic text-muted-foreground">{message}</p>
        </div>
      )}
      
      {discourse && (
        <div>
          <h4 className="text-sm font-medium">Task Discussion</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{discourse}</p>
        </div>
      )}
      
      {appliedAt && (
        <div className="text-xs text-muted-foreground">
          Applied: {appliedAt}
        </div>
      )}
    </div>
  );
};
