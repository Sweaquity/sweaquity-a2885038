
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusBadgeVariant = "default" | "destructive" | "outline" | "secondary" | "success";

// Map status to appropriate variant
const getStatusVariant = (status: string): StatusBadgeVariant => {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'withdrawn':
      return 'destructive';
    case 'pending':
      return 'secondary';
    case 'negotiation':
      return 'outline';
    default:
      return 'default';
  }
};

// Map status to display text
const getStatusDisplay = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'Pending';
    case 'negotiation':
      return 'Negotiation';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return status;
  }
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <Badge
      variant={getStatusVariant(status)}
      className={cn(className)}
    >
      {getStatusDisplay(status)}
    </Badge>
  );
};
