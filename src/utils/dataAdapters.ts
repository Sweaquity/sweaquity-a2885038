
import { JobApplication } from '@/types/jobSeeker';

/**
 * Enhances Job Application data with related information from joined tables
 * Maps fields like task_title, company_name, project_title, etc. without changing the data structure
 */
export const enhanceJobApplication = (application: JobApplication): JobApplication => {
  return {
    ...application,
    // Use existing fields or provide fallbacks
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
    
    applicant_skills: application.applicant_skills || [],
    
    // Ensure ID is always available
    id: application.job_app_id || application.id || `app-${Math.random()}`,
    
    // Fallback for description
    description: application.description || application.business_roles?.description || ""
  };
};

/**
 * Adapts Ticket data to ensure all required fields are present
 */
export const enhanceTicket = (ticket: any): any => {
  return {
    ...ticket,
    // Map type properly
    type: ticket.type || ticket.ticket_type || "task",
    ticket_type: ticket.ticket_type || ticket.type || "task",
    
    // Ensure description exists
    description: ticket.description || "",
    
    // Properties for backwards compatibility
    isTaskTicket: ticket.isTaskTicket || ticket.ticket_type === 'task' || ticket.type === 'task',
    isProjectTicket: ticket.isProjectTicket || ticket.ticket_type === 'project' || ticket.type === 'project',
  };
};

/**
 * Batch enhance multiple tickets
 */
export const enhanceTickets = (tickets: any[]): any[] => {
  return tickets.map(enhanceTicket);
};

/**
 * Batch enhance multiple job applications
 */
export const enhanceJobApplications = (applications: JobApplication[]): JobApplication[] => {
  return applications.map(enhanceJobApplication);
};
