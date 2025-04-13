
import { Application } from "@/types/business";
import { JobApplication, Skill } from "@/types/jobSeeker";

/**
 * Converts an Application object to a JobApplication object
 * Handles type differences and ensures proper type conversion
 * 
 * ID Mapping:
 * - job_app_id: The unique ID of the application itself
 * - project_id: The ID of the project the application is for
 * - task_id: The ID of the specific task/role within the project
 * - business_roles.id: References the task_id (the specific role being applied for)
 */
export function convertApplicationToJobApplication(application: Application): JobApplication {
  // Helper function to normalize skill requirements to a consistent format
  const normalizeSkillRequirements = (skillReqs: any) => {
    if (!skillReqs) return [];
    
    if (Array.isArray(skillReqs)) {
      return skillReqs.map(req => {
        if (typeof req === 'string') {
          return { skill: req, level: "Intermediate" };
        }
        // Ensure required properties exist
        return {
          skill: req.skill || (req.name || ""),
          level: req.level || "Intermediate"
        };
      });
    }
    
    return [];
  };

  // Create a basic JobApplication object
  const jobApplication: JobApplication = {
    job_app_id: application.job_app_id,
    user_id: application.user_id,
    task_id: application.task_id,
    project_id: application.project_id,
    status: application.status,
    applied_at: application.applied_at || "",
    notes: application.notes ? [application.notes] : [], // Convert string to array
    message: application.message || "",
    cv_url: application.cv_url,
    task_discourse: application.task_discourse || "",
    id: application.job_app_id, // Ensure id matches job_app_id for consistency
    accepted_jobseeker: application.accepted_jobseeker || false,
    accepted_business: application.accepted_business || false,
    // Use helper function to ensure consistent skill requirement format
    business_roles: {
      // The ID here should reference the task_id - this is the specific role/task the applicant is applying for
      id: application.task_id || "",
      title: application.business_roles?.title || "",
      description: application.business_roles?.description || "",
      project_title: application.business_roles?.project?.title || "",
      timeframe: application.business_roles?.timeframe,
      skill_requirements: normalizeSkillRequirements(application.business_roles?.skill_requirements),
      equity_allocation: application.business_roles?.equity_allocation,
      project_status: application.business_roles?.project?.status
    },
    // Add hasEquityData property for type compatibility
    hasEquityData: false, // Default value if accepted_jobs is not available
    is_equity_project: false // Default value
  };

  // Handle optional fields conditionally to avoid TypeScript errors
  if ('accepted_jobs' in application && application.accepted_jobs) {
    jobApplication.accepted_jobs = {
      equity_agreed: application.accepted_jobs.equity_agreed || 0,
      jobs_equity_allocated: application.accepted_jobs.jobs_equity_allocated || 0,
      id: application.accepted_jobs.id || "",
      date_accepted: application.accepted_jobs.date_accepted || ""
    };
    jobApplication.hasEquityData = true;
  }

  return jobApplication;
}
