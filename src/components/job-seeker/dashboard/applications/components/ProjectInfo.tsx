
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProjectInfoProps {
  company?: string;
  project?: string;
  role?: string;
  appliedDate?: string;
}

export const ProjectInfo = ({ company, project, role, appliedDate }: ProjectInfoProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Company</span>
            <span className="text-sm">{company || 'N/A'}</span>
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex flex-col">
            <span className="text-sm font-medium">Project</span>
            <span className="text-sm">{project || 'N/A'}</span>
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex flex-col">
            <span className="text-sm font-medium">Role</span>
            <span className="text-sm">{role || 'N/A'}</span>
          </div>
          
          {appliedDate && (
            <>
              <Separator className="my-2" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Applied</span>
                <span className="text-sm">{new Date(appliedDate).toLocaleDateString()}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
