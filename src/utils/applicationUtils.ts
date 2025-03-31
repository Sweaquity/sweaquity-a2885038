
import { JobApplication } from '@/types/applications';
import { BusinessRole, SubTask } from '@/types/businessRoles';
import { Skill } from '@/types/profile';

// Convert a job application from DB format to the expected UI format
export const convertApplicationToJobApplication = (application: any): JobApplication => {
  if (!application) return null;

  // Extract business role data
  let businessRoles: BusinessRole = null;
  if (application.business_roles) {
    businessRoles = {
      title: application.business_roles.title || '',
      description: application.business_roles.description || '',
      company_name: application.business_roles.company_name,
      project_title: application.business_roles.project_title,
      status: application.business_roles.status || 'active',
      project_status: application.business_roles.project_status,
      project_id: application.business_roles.project_id,
    };

    // Convert skill requirements if they exist
    if (application.business_roles.skill_requirements && 
        Array.isArray(application.business_roles.skill_requirements)) {
      businessRoles.skill_requirements = application.business_roles.skill_requirements.map((skill: any) => {
        if (typeof skill === 'string') return skill;
        return {
          skill: skill.skill || skill.name || '',
          level: skill.level || 'Intermediate'
        };
      });
    }
  }

  // Process accepted_jobs data
  let acceptedJobs = null;
  if (application.accepted_jobs) {
    const jobData = typeof application.accepted_jobs === 'object' ? application.accepted_jobs : {};
    acceptedJobs = {
      equity_agreed: Number(jobData.equity_agreed || 0),
      jobs_equity_allocated: Number(jobData.jobs_equity_allocated || 0),
      id: jobData.id || '',
      date_accepted: jobData.date_accepted || new Date().toISOString(),
    };
  }

  // Set hasEquityData flag
  const hasEquityData = !!acceptedJobs;

  // Create the JobApplication object
  return {
    job_app_id: application.job_app_id || application.id,
    user_id: application.user_id || '',
    task_id: application.task_id || '',
    project_id: application.project_id,
    status: application.status || 'pending',
    message: application.message,
    cv_url: application.cv_url,
    accepted_jobseeker: !!application.accepted_jobseeker,
    accepted_business: !!application.accepted_business,
    applied_at: application.applied_at || application.created_at || new Date().toISOString(),
    business_roles: businessRoles,
    task_discourse: application.task_discourse,
    notes: application.notes || [],
    accepted_jobs: acceptedJobs,
    hasEquityData: hasEquityData,
    is_equity_project: !!application.is_equity_project,
  };
};
