
import React from 'react';

export interface ApplicationHeaderProps {
  title?: string;
  company?: string;
  project?: string;
  status?: string;
}

export const ApplicationHeader = ({ title, company, project, status }: ApplicationHeaderProps) => {
  return (
    <div className="flex flex-col">
      <h3 className="font-medium text-base">{title}</h3>
      <p className="text-sm text-muted-foreground">
        {company}
        {project && ` • ${project}`}
      </p>
    </div>
  );
};
