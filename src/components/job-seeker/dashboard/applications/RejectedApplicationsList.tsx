
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { JobApplication } from '@/types/jobSeeker';

interface RejectedApplicationsListProps {
  applications: JobApplication[];
}

export const RejectedApplicationsList: React.FC<RejectedApplicationsListProps> = ({
  applications
}) => {
  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <h3 className="text-lg font-medium">No Rejected Applications</h3>
            <p className="text-muted-foreground mt-2">
              You don't have any rejected applications at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map(application => (
        <Card key={application.job_app_id || application.id || `app-${Math.random()}`}>
          <CardContent className="p-4">
            <div className="text-center py-2">
              <p className="text-sm">Placeholder for rejected application item</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
