
import { Skill, SkillRequirement } from "./jobSeeker";
import { Task, TaskType } from "./dashboard";

export interface GanttTask extends Task {
  styles?: {
    progressColor?: string;
    progressSelectedColor?: string;
  };
}

export interface Application {
  job_app_id: string;
  task_id: string;
  user_id: string;
  applied_at: string;
  updated_at?: string;
  status: string;
  message: string;
  cv_url: string | null;
  skillMatch?: number;
  task_discourse?: string;
  accepted_business?: boolean;
  accepted_jobseeker?: boolean;
  notes?: string;
  role_id?: string;
  id?: string;
  project_id: string; // Required property to match JobApplication type
  profile: {
    first_name: string;
    last_name: string;
    title: string;
    location: string;
    employment_preference: string;
    skills?: Skill[];
  };
  business_roles: {
    title: string;
    description: string;
    skill_requirements?: SkillRequirement[];
    equity_allocation?: number;
    timeframe?: string;
    project?: {
      title: string;
    }
    project_title?: string;
  };
}

export interface Project {
  project_id: string;
  title: string;
  description: string;
  skills_required?: string[];
  applications: Application[];
}

// Add our ProjectJobApplication interface for consistency
export interface ProjectJobApplication {
  job_app_id: string;
  project_id: string;
  user_id: string;
  task_id: string;
  status: string;
  applied_at: string;
  notes: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  business_projects?: {
    title: string;
  };
  project_sub_tasks?: {
    title: string;
  };
}
