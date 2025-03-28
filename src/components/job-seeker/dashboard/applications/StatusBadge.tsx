
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'accepted' || statusLower === 'completed') return 'bg-green-500';
    if (statusLower === 'rejected') return 'bg-red-500';
    if (statusLower === 'withdrawn') return 'bg-yellow-500';
    if (statusLower === 'pending') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <Badge className={`${getStatusColor(status)}`} variant="secondary">
      {status}
    </Badge>
  );
};
