
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ApplicationStatusProps {
  status: string;
  highlightPending?: boolean;
}

export const ApplicationStatus = ({ status, highlightPending = false }: ApplicationStatusProps) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let statusText = status.charAt(0).toUpperCase() + status.slice(1);
  
  switch (status.toLowerCase()) {
    case 'pending':
      variant = highlightPending ? "default" : "secondary";
      break;
    case 'accepted':
      variant = "default"; // primary color
      break;
    case 'rejected':
      variant = "destructive";
      break;
    case 'withdrawn':
      variant = "outline";
      break;
    case 'completed':
      variant = "secondary";
      break;
    default:
      variant = "secondary";
  }
  
  return (
    <Badge variant={variant} className="text-xs font-medium">
      {statusText}
    </Badge>
  );
};
