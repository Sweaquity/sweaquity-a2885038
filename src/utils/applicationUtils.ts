
import { JobApplication, BusinessRole, EquityProject } from '@/types/jobSeeker';
import { Skill } from '@/types/profile';
import { Application } from '@/types/business';

export const formatApplicationDate = (dateString?: string) => {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
};

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
      return 'bg-green-500';
    case 'rejected':
      return 'bg-red-500';
    case 'pending':
      return 'bg-yellow-500';
    case 'withdrawn':
      return 'bg-gray-500';
    default:
      return 'bg-blue-500';
  }
};

export const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'pending':
      return 'Pending';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return status || 'Unknown';
  }
};

// Convert backend data to frontend format for job applications
export const normalizeJobApplication = (data: any): JobApplication => {
  // Handle skills - ensure they're in the right format
  let skills: string[] = [];
  
  if (data.skills) {
    if (Array.isArray(data.skills)) {
      if (typeof data.skills[0] === 'string') {
        skills = data.skills;
      } else {
        // Convert skill objects to strings if needed
        skills = data.skills.map((s: any) => {
          if (typeof s === 'string') return s;
          return s.skill || s.name || '';
        }).filter(Boolean);
      }
    }
  }
  
  // Ensure accepted_jobs exists and has the correct structure
  const accepted_jobs = data.accepted_jobs || {
    equity_agreed: 0,
    jobs_equity_allocated: 0,
    id: data.job_app_id || 'unknown',
    date_accepted: data.date_accepted || new Date().toISOString()
  };
  
  // Create the normalized job application
  const normalizedApp: JobApplication = {
    job_app_id: data.job_app_id || '',
    user_id: data.user_id || '',
    task_id: data.task_id || '',
    project_id: data.project_id || '',
    status: data.status || 'pending',
    message: data.message || '',
    cv_url: data.cv_url || '',
    accepted_jobseeker: Boolean(data.accepted_jobseeker),
    accepted_business: Boolean(data.accepted_business),
    applied_at: data.applied_at || new Date().toISOString(),
    updated_at: data.updated_at || data.applied_at || new Date().toISOString(),
    created_at: data.created_at || data.applied_at || new Date().toISOString(),
    is_equity_project: Boolean(data.is_equity_project),
    task_discourse: data.task_discourse || '',
    accepted_jobs,
    
    // Optional fields
    task_title: data.task_title || data.subtask_title || '',
    task_description: data.task_description || data.subtask_description || '',
    project_title: data.project_title || '',
    project_description: data.project_description || '',
    equity_allocation: data.equity_allocation || data.equity_allocated || 0,
    timeframe: data.timeframe || '',
    applicant_name: data.applicant_name || '',
    applicant_email: data.applicant_email || '',
    applicant_skills: skills,
    business_id: data.business_id || '',
    business_name: data.business_name || '',
    hasEquityData: Boolean(data.accepted_jobs && 
      (data.accepted_jobs.equity_agreed || data.accepted_jobs.jobs_equity_allocated))
  };
  
  return normalizedApp;
};

export const normalizeBusinessRole = (data: any): BusinessRole => {
  return {
    id: data.id || '',
    title: data.title || '',
    description: data.description || '',
    business_id: data.business_id || '',
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || data.created_at || new Date().toISOString(),
    open_to_recruiters: Boolean(data.open_to_recruiters),
    // Additional properties from joins
    company_name: data.company_name || data.businesses?.company_name || '',
    company_website: data.company_website || data.businesses?.company_website || '',
    status: data.status || 'active'
  };
};

export const normalizeEquityProject = (data: any): EquityProject => {
  // Normalize skills
  const skills_required = data.skills_required || data.project?.skills_required || [];
  
  return {
    project_id: data.project_id || '',
    title: data.title || data.project_title || '',
    description: data.description || data.project_description || '',
    equity_allocation: data.equity_allocation || 0,
    project_timeframe: data.project_timeframe || data.timeframe || '',
    skills_required,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || data.created_at || new Date().toISOString(),
    business_id: data.business_id || '',
    status: data.status || 'active',
    tasks: data.tasks || [],
    company_name: data.company_name || data.business?.company_name || '',
    equity_allocated: data.equity_allocated || 0,
    completion_percentage: data.completion_percentage || 0
  };
};

// Add the missing convertApplicationToJobApplication function
export const convertApplicationToJobApplication = (application: Application): JobApplication => {
  const jobApp: JobApplication = {
    job_app_id: application.job_app_id,
    user_id: application.user_id,
    task_id: application.task_id,
    status: application.status,
    message: application.message,
    cv_url: application.cv_url,
    accepted_jobseeker: application.accepted_jobseeker,
    accepted_business: application.accepted_business,
    applied_at: application.applied_at,
    updated_at: application.updated_at,
    created_at: application.created_at,
    task_discourse: application.task_discourse,
    project_id: application.project_id,
    
    // Map properties from business_roles
    task_title: application.business_roles?.title || '',
    task_description: application.business_roles?.description || '',
    equity_allocation: application.business_roles?.equity_allocation || 0,
    timeframe: application.business_roles?.timeframe || '',
    
    // Map any other properties needed
    is_equity_project: true, // Assuming all applications from business context are equity projects
    
    // Create an accepted_jobs object with the required fields
    accepted_jobs: {
      equity_agreed: application.accepted_jobs?.equity_agreed || 0,
      jobs_equity_allocated: application.accepted_jobs?.jobs_equity_allocated || 0,
      id: application.accepted_jobs?.id || application.job_app_id,
      date_accepted: application.accepted_jobs?.date_accepted || new Date().toISOString()
    },
    
    // Map profile info if available
    applicant_name: application.profile ? `${application.profile.first_name} ${application.profile.last_name}`.trim() : '',
    applicant_email: '',
    applicant_skills: application.profile?.skills?.map(s => typeof s === 'string' ? s : s.skill) || [],
    
    // Skills matching
    skillMatch: application.skillMatch,
    
    // Computed properties
    hasEquityData: Boolean(application.accepted_jobs && 
      (application.accepted_jobs.equity_agreed || application.accepted_jobs.jobs_equity_allocated))
  };
  
  return jobApp;
};
