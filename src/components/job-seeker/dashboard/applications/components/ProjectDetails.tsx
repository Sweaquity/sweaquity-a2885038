
import React from 'react';
import { JobApplication } from '@/types/jobSeeker';

interface ProjectDetailsProps {
  application: JobApplication;
}

export const ProjectDetails = ({ application }: ProjectDetailsProps) => {
  return (
    <div>
      <h4 className="font-medium mb-1">Project Description</h4>
      <p className="text-sm text-muted-foreground">
        {application.business_roles?.description || "No description provided."}
      </p>
    </div>
  );
};
