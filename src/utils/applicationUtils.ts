
import { JobApplication } from '@/types/consolidatedTypes';

export interface ApplicationStats {
  pending: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
}

export const getApplicationStats = (applications: JobApplication[]): ApplicationStats => {
  return {
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    withdrawn: applications.filter(app => app.status === 'withdrawn').length,
  };
};

export const formatApplicationDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-500';
    case 'accepted':
      return 'bg-green-500';
    case 'rejected':
      return 'bg-red-500';
    case 'withdrawn':
      return 'bg-gray-500';
    case 'completed':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
};

export const getReadableStatus = (
  app: JobApplication | { title: string }
): string => {
  if (!app) return 'Unknown';
  
  // Check if we have a JobApplication with status property
  if ('status' in app && app.status) {
    return app.status.charAt(0).toUpperCase() + app.status.slice(1);
  }
  
  return 'Pending'; // Default status
};

export const getEquityInfo = (jobAppId: string, acceptedJobs: any[] = []): {
  equity: number;
  allocated: number;
  acceptedDate: string | null;
} => {
  const acceptedJob = acceptedJobs?.find(job => job && typeof job === 'object' && job.job_app_id === jobAppId);
  
  if (!acceptedJob) {
    return {
      equity: 0,
      allocated: 0,
      acceptedDate: null
    };
  }
  
  return {
    equity: Number(acceptedJob.equity_agreed || 0),
    allocated: Number(acceptedJob.jobs_equity_allocated || 0),
    acceptedDate: acceptedJob.date_accepted || null
  };
};
