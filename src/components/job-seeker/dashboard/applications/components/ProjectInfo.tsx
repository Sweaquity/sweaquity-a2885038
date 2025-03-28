
import React from 'react';
import { JobApplication } from '@/types/jobSeeker';
import { formatDistanceToNow, format } from 'date-fns';

interface ProjectInfoProps {
  application: JobApplication;
}

export const ProjectInfo = ({ application }: ProjectInfoProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  const formatTimeframe = (timeframe?: string) => {
    if (!timeframe) return "Not specified";
    return timeframe;
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2">
        <div className="text-sm font-medium">Status:</div>
        <div className="text-sm">{application.business_roles?.task_status || "pending"}</div>
      </div>
      <div className="grid grid-cols-2">
        <div className="text-sm font-medium">Timeframe:</div>
        <div className="text-sm">{formatTimeframe(application.business_roles?.timeframe)}</div>
      </div>
      <div className="grid grid-cols-2">
        <div className="text-sm font-medium">Applied:</div>
        <div className="text-sm">{formatDate(application.applied_at)}</div>
      </div>
      <div className="grid grid-cols-2">
        <div className="text-sm font-medium">Completion:</div>
        <div className="text-sm">{application.business_roles?.completion_percentage || 0}%</div>
      </div>
    </div>
  );
};
