
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { JobApplication } from '@/types/jobSeeker';
import { formatDistanceToNow } from 'date-fns';

interface ProjectHeaderProps {
  application: JobApplication;
}

export const ProjectHeader = ({ application }: ProjectHeaderProps) => {
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  return (
    <div>
      <div className="text-lg flex items-center font-medium">
        {application.business_roles?.title || "Untitled Role"}
        <Badge className="ml-2 bg-green-500" variant="secondary">
          {application.status}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {application.business_roles?.company_name || "Company"} | Project: {application.business_roles?.project_title || "Project"}
      </div>
      <div className="text-xs text-muted-foreground">
        Applied: {getTimeAgo(application.applied_at)}
      </div>
    </div>
  );
};
