
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProjectDetailsProps {
  description?: string;
  status?: string;
  equity?: number | string;
  timeframe?: string;
}

export const ProjectDetails = ({ description, status, equity, timeframe }: ProjectDetailsProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          {description && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">Description</span>
              <span className="text-sm">{description}</span>
            </div>
          )}
          
          {status && (
            <>
              <Separator className="my-2" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Status</span>
                <span className="text-sm">{status}</span>
              </div>
            </>
          )}
          
          {equity !== undefined && (
            <>
              <Separator className="my-2" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Equity Allocation</span>
                <span className="text-sm">{typeof equity === 'number' ? `${equity}%` : equity}</span>
              </div>
            </>
          )}
          
          {timeframe && (
            <>
              <Separator className="my-2" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Timeframe</span>
                <span className="text-sm">{timeframe}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
