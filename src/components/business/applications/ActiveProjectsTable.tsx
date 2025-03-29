
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ActiveProjectsTableProps {
  status: string;
}

export const ActiveProjectsTable = ({ status }: ActiveProjectsTableProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center py-4">
          <p className="text-muted-foreground">
            Active project applications will appear here
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
