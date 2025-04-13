
import { 
  Skill, 
  JobApplication, 
  EquityProject 
} from '@/types/consolidatedTypes';

export const convertToSkill = (rawSkill: any): Skill => {
  return {
    id: rawSkill.id || undefined,
    skill: rawSkill.skill || rawSkill.name || '',
    name: rawSkill.name || rawSkill.skill || '',
    level: rawSkill.level || undefined,
    years: rawSkill.years || undefined
  };
};

export const convertToJobApplication = (rawApp: any): JobApplication => {
  return {
    job_app_id: rawApp.job_app_id || '',
    task_id: rawApp.task_id || '',
    user_id: rawApp.user_id || '',
    project_id: rawApp.project_id,
    status: rawApp.status || 'pending',
    message: rawApp.message,
    task_discourse: rawApp.task_discourse,
    created_at: rawApp.created_at,
    updated_at: rawApp.updated_at,
    applied_at: rawApp.applied_at || rawApp.created_at || new Date().toISOString(),
    accepted_business: rawApp.accepted_business || false,
    accepted_jobseeker: rawApp.accepted_jobseeker || false,
    applicant_anonymized: rawApp.applicant_anonymized || false,
    cv_url: rawApp.cv_url,
    business_roles: rawApp.business_roles,
    task_title: rawApp.task_title,
    description: rawApp.description,
    company_name: rawApp.company_name,
    project_title: rawApp.project_title,
    accepted_jobs: rawApp.accepted_jobs,
    hasEquityData: rawApp.hasEquityData || false,
    notes: rawApp.notes
  };
};

export const convertToEquityProject = (rawProject: any): EquityProject => {
  return {
    projectId: rawProject.project_id || rawProject.id || '',
    title: rawProject.title || '',
    description: rawProject.description,
    equity: rawProject.equity_amount || rawProject.equity || 0,
    equityEarned: rawProject.jobs_equity_allocated || 0,
    status: rawProject.status || '',
    ticketId: rawProject.ticket_id,
    taskId: rawProject.task_id,
    completionPercentage: rawProject.completion_percentage,
    // Compatibility properties
    id: rawProject.id,
    project_id: rawProject.project_id,
    equity_amount: rawProject.equity_amount,
    time_allocated: rawProject.time_allocated,
    start_date: rawProject.start_date,
    updated_at: rawProject.updated_at,
    total_hours_logged: rawProject.total_hours_logged || 0,
    skill_match: rawProject.skill_match,
    created_by: rawProject.created_by,
    business_roles: rawProject.business_roles,
    sub_tasks: rawProject.sub_tasks || [],
    created_at: rawProject.created_at,
    skills_required: rawProject.skills_required || [],
    skill_requirements: rawProject.skill_requirements || []
  };
};
