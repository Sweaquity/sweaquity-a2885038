
import { BusinessRole, SkillRequirement } from './consolidatedTypes';

export interface SubTask {
  id: string;
  task_id?: string;
  title: string;
  description?: string;
  status?: string;
  equity_allocation: number;
  timeframe?: string;
  skill_requirements?: SkillRequirement[];
  completion_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  project_id: string;
  title: string;
  description?: string;
  status?: string;
  equity_allocation: number;
  equity_allocated?: number;
  completion_percentage?: number;
  created_at?: string;
  updated_at?: string;
  business_id?: string;
  created_by?: string;
  tasks?: Task[];
  sub_tasks?: SubTask[];
  applications?: Application[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status?: string;
  project_id?: string;
  assigned_to?: string;
  hours_logged: number;
  equity_earned?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Application {
  job_app_id: string;
  task_id: string;
  user_id: string;
  project_id?: string;
  status: string;
  applied_at?: string;
  message?: string;
  task_discourse?: string;
  accepted_business?: boolean;
  accepted_jobseeker?: boolean;
  profile?: {
    first_name?: string;
    last_name?: string;
    title?: string;
    location?: string;
    skills?: any[];
  };
  business_roles?: BusinessRole;
  skillMatch?: number;
  cv_url?: string;
  applicant_anonymized?: boolean;
  description?: string;
  task_title?: string;
  company_name?: string;
  project_title?: string;
}
