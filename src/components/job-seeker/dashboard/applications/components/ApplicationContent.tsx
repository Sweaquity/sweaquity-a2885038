
import React from 'react';
import { format } from 'date-fns';

export interface ApplicationContentProps {
  description?: string;
  message?: string;
  discourse?: string;
  appliedAt?: string;
}

export const ApplicationContent = ({
  description,
  message,
  discourse,
  appliedAt
}: ApplicationContentProps) => {
  return (
    <div className="space-y-3 mt-2">
      {description && (
        <div>
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      )}
      
      {message && (
        <div>
          <h4 className="text-sm font-medium mb-1">Your Message</h4>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      )}
      
      {discourse && (
        <div>
          <h4 className="text-sm font-medium mb-1">Project Discourse</h4>
          <p className="text-sm text-gray-600">{discourse}</p>
        </div>
      )}
      
      {appliedAt && (
        <div className="flex justify-end">
          <p className="text-xs text-gray-400">
            Applied on {format(new Date(appliedAt), 'PPP')}
          </p>
        </div>
      )}
    </div>
  );
};
