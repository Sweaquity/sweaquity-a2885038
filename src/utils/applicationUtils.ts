
import { Application } from "@/types/business";
import { JobApplication, Skill, SkillRequirement } from "@/types/jobSeeker";

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
  // Convert skill requirements to the correct format that satisfies both interfaces
  const convertedSkillRequirements = Array.isArray(application.business_roles?.skill_requirements) 
    ? application.business_roles.skill_requirements.map(req => {
        if (typeof req === 'string') {
          return { skill: req, level: "Intermediate" } as Skill;
        }
        return req as Skill;
      }) 
    : [];

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
    id: application.job_app_id, // Ensure id matches job_app_id for consistency
    accepted_jobseeker: application.accepted_jobseeker || false,
    accepted_business: application.accepted_business || false,
    business_roles: {
      // The ID here should reference the task_id - this is the specific role/task the applicant is applying for
      id: application.task_id || "",
      title: application.business_roles?.title || "",
      description: application.business_roles?.description || "",
      project_title: application.business_roles?.project?.title || "",
      timeframe: application.business_roles?.timeframe,
      skill_requirements: convertedSkillRequirements,
      equity_allocation: application.business_roles?.equity_allocation
    }
  };
}
