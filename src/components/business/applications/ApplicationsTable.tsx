
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ApplicationsTableProps {
  status: string;
}

export const ApplicationsTable = ({ status }: ApplicationsTableProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center py-4">
          <p className="text-muted-foreground">
            {status === 'pending' 
              ? 'Applications awaiting review will appear here' 
              : status === 'active' 
                ? 'Applications in progress will appear here' 
                : 'Completed applications will appear here'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
