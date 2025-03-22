
import { Application } from "@/types/business";
import { JobApplication } from "@/types/jobSeeker";

/**
 * Converts an Application object to a JobApplication object
 * Handles type differences and ensures proper type conversion
 */
export function convertApplicationToJobApplication(application: Application): JobApplication {
  return {
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
    id: application.job_app_id,
    accepted_jobseeker: application.accepted_jobseeker || false,
    accepted_business: application.accepted_business || false,
    business_roles: {
      id: application.business_roles?.id, // Use id instead of role_id
      title: application.business_roles?.title || "",
      description: application.business_roles?.description || "",
      project_title: application.business_roles?.project?.title || "",
      timeframe: application.business_roles?.timeframe,
      skill_requirements: Array.isArray(application.business_roles?.skill_requirements) 
        ? application.business_roles.skill_requirements.map(req => {
            if (typeof req === 'string') {
              return { skill: req, level: "Intermediate" };
            }
            return req;
          }) 
        : [],
      equity_allocation: application.business_roles?.equity_allocation
    }
  };
}
