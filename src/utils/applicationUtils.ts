
import { Application } from "@/types/business";
import { JobApplication } from "@/types/applications";

/**
 * Converts an Application object to a JobApplication object
 * Handles type differences and ensures proper type conversion
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
    
    // Type-safe assignment for businesses property which may be undefined in Application
    businesses: application.businesses ? {
      businesses_id: application.businesses.businesses_id || "",
      company_name: application.businesses.company_name || ""
    } : { businesses_id: "" },

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
      // Safely access project status with fallback
      project_status: application.business_roles?.project && 
                     typeof application.business_roles.project === 'object' ? 
                     (application.business_roles.project.status || "active") : "active"
    },
    // Add hasEquityData property for type compatibility
    hasEquityData: false, // Default value if accepted_jobs is not available
    is_equity_project: false, // Default value
    
    // Safely handle properties that may not exist in Application type
    nda_document_id: application.nda_document_id || null,
    nda_status: application.nda_status || null
  };

  // Handle accepted_jobs data if available
  if ('accepted_jobs' in application && application.accepted_jobs) {
    const acceptedJobs = application.accepted_jobs;
    if (acceptedJobs && typeof acceptedJobs === 'object') {
      // Type-safe access to accepted_jobs properties with fallbacks
      jobApplication.accepted_jobs = {
        equity_agreed: typeof acceptedJobs.equity_agreed === 'number' ? 
          acceptedJobs.equity_agreed : 0,
        jobs_equity_allocated: typeof acceptedJobs.jobs_equity_allocated === 'number' ? 
          acceptedJobs.jobs_equity_allocated : 0,
        id: acceptedJobs.id?.toString() || "",
        date_accepted: acceptedJobs.date_accepted?.toString() || ""
      };
      jobApplication.hasEquityData = true;
    }
  }

  return jobApplication;
}
