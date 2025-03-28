
import { Ticket } from '@/types/types';
import { JobApplication } from '@/types/jobSeeker';

/**
 * Adapts a database ticket to ensure it has all required fields
 */
export const adaptDatabaseTicket = (ticket: any): Ticket => {
  return {
    ...ticket,
    // Ticket type compatibility
    type: ticket.type || ticket.ticket_type || 'task',
    
    // Ensure required fields
    description: ticket.description || '',
    id: ticket.id || '',
    title: ticket.title || '',
    status: ticket.status || 'todo',
    priority: ticket.priority || 'medium',
    health: ticket.health || 'good'
  };
};

/**
 * Adapts database job application to ensure it has all required fields
 */
export const adaptDatabaseJobApplication = (application: any): JobApplication => {
  return {
    ...application,
    // Ensure ID is available in both formats
    id: application.job_app_id || application.id || `app-${Math.random()}`,
    job_app_id: application.job_app_id || application.id || `app-${Math.random()}`,
    
    // Status and message fallbacks
    status: application.status || 'pending',
    message: application.message || '',
    
    // Applicant info
    user_id: application.user_id || '',
    cv_url: application.cv_url || '',
    
    // Task ID fallback
    task_id: application.task_id || '',
    
    // Related task info (mapped from business_roles or task)
    task_title: application.task_title || 
                (application.business_roles?.title) || 
                "Untitled Task",
    
    company_name: application.company_name || 
                 (application.business_roles?.company_name) || 
                 "Company",
    
    project_title: application.project_title || 
                  (application.business_roles?.project_title) || 
                  "Project",
    
    // Provide fallbacks for skills
    skills_required: application.skills_required || 
                    (Array.isArray(application.business_roles?.skill_requirements) 
                      ? application.business_roles?.skill_requirements 
                      : []),
    
    applicant_skills: application.applicant_skills || []
  };
};
