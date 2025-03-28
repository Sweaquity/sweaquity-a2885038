
import React from 'react';
import { JobApplication } from '@/types/jobSeeker';
import { PastApplicationItem } from './PastApplicationItem';

export interface PastApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const PastApplicationsList = ({ 
  applications,
  onApplicationUpdated 
}: PastApplicationsListProps) => {
  // Filter past applications (rejected, withdrawn, etc.)
  const pastApplications = applications.filter(
    app => app.status === 'withdrawn' || app.status === 'rejected'
  );

  if (pastApplications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No past applications found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pastApplications.map((application) => (
        <PastApplicationItem
          key={application.id}
          application={application}
          onApplicationUpdated={onApplicationUpdated}
        />
      ))}
    </div>
  );
};
