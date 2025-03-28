
import React from 'react';
import { JobApplication } from '@/types/jobSeeker';
import { formatDistanceToNow, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ApplicationItemContentProps {
  application: JobApplication;
}

export const ApplicationItemContent = ({ application }: ApplicationItemContentProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h4 className="font-medium mb-1">Description</h4>
        <p className="text-sm text-muted-foreground">{application.business_roles?.description || "No description provided."}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Application Details</h4>
          <div className="space-y-2">
            <div className="grid grid-cols-2">
              <div className="text-sm font-medium">Status:</div>
              <div className="text-sm">{application.status}</div>
            </div>
            <div className="grid grid-cols-2">
              <div className="text-sm font-medium">Applied:</div>
              <div className="text-sm">{formatDate(application.applied_at)}</div>
            </div>
            {application.accepted_jobs?.date_accepted && (
              <div className="grid grid-cols-2">
                <div className="text-sm font-medium">Accepted:</div>
                <div className="text-sm">{formatDate(application.accepted_jobs.date_accepted)}</div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-1">
            {Array.isArray(application.business_roles?.skill_requirements) ? (
              application.business_roles.skill_requirements.map((skill, index) => {
                const skillName = typeof skill === 'string' ? skill : (skill.skill || '');
                const level = typeof skill === 'string' ? undefined : skill.level;
                
                return (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skillName} {level && <span className="opacity-70">({level})</span>}
                  </Badge>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No skills specified</p>
            )}
          </div>
        </div>
      </div>

      {application.message && (
        <div>
          <h4 className="font-medium mb-1">Your Application Message</h4>
          <p className="text-sm bg-gray-50 p-3 rounded-md">{application.message}</p>
        </div>
      )}

      {application.task_discourse && (
        <div>
          <h4 className="font-medium mb-1">Communication</h4>
          <div className="text-sm bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto whitespace-pre-line">
            {application.task_discourse}
          </div>
        </div>
      )}
    </div>
  );
};
