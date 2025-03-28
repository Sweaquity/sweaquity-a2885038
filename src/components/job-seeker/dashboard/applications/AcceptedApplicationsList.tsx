
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { JobApplication } from '@/types/jobSeeker';

interface AcceptedApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const AcceptedApplicationsList: React.FC<AcceptedApplicationsListProps> = ({
  applications,
  onApplicationUpdated
}) => {
  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <h3 className="text-lg font-medium">No Accepted Applications</h3>
            <p className="text-muted-foreground mt-2">
              You don't have any accepted applications at the moment.
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
              <p className="text-sm">Placeholder for accepted application item</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
