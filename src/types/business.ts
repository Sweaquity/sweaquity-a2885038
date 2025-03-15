
import { Skill } from "./jobSeeker";

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
  project_id: string;
  applicant_anonymized?: boolean;
  applicant_email?: string;
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
    skill_requirements?: Skill[];
    equity_allocation?: number;
    timeframe?: string;
    project?: {
      title: string;
    }
    project_title?: string;
    company_name?: string;
  };
}

export interface Project {
  project_id: string;
  title: string;
  description: string;
  skills_required?: string[];
  applications: Application[];
}

export interface BusinessRole {
  id: string;
  title: string;
  description: string;
  skill_requirements?: Skill[];
  equity_allocation?: number;
  timeframe?: string;
  project?: {
    title: string;
  }
}

export interface EquityProject {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  business_id: string;
  equity_allocation: number;
  equity_allocated: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: SubTask[];
  business_roles: BusinessRole[];
  skill_match?: number;
  match_level?: 'high' | 'medium' | 'low' | 'none';
  matched_skills?: string[];
  missing_skills?: string[];
}

export interface SubTask {
  id: string;
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  task_status: string;
  equity_allocation: number;
  timeframe: string;
  skill_requirements: Skill[];
  progress: number;
  skill_match?: number;
  match_level?: 'high' | 'medium' | 'low' | 'none';
  matched_skills?: string[];
  missing_skills?: string[];
}
