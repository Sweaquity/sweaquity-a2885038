
import { Ticket as CoreTicket } from './types';

// Create a unified Skill interface
export interface Skill {
  id?: string;
  skill: string;
  name?: string;
  level?: string;
  years?: number;
}

// Create a unified JobApplication interface
export interface JobApplication {
  job_app_id: string;
  task_id: string;
  user_id: string;
  project_id?: string;
  status: string;
  message?: string;
  task_discourse?: string;
  created_at?: string;
  updated_at?: string;
  applied_at: string;
  accepted_business?: boolean;
  accepted_jobseeker?: boolean;
  applicant_anonymized?: boolean;
  cv_url?: string;
  business_roles?: BusinessRole;
  task_title?: string;
  description?: string;
  company_name?: string;
  project_title?: string;
  accepted_jobs?: any;
  hasEquityData?: boolean;
  notes?: string;
  id?: string;
  applicant_skills?: string[];
}

// Create a unified BusinessRole interface
export interface BusinessRole {
  id: string;
  title: string;
  description?: string;
  company_name?: string;
  project_title?: string;
  project_id?: string;
  equity_allocation?: number;
  timeframe?: string;
  task_status?: string;
  project_status?: string;
  completion_percentage?: number;
  skill_requirements?: SkillRequirement[];
  project?: {
    title: string;
  };
}

// Create a unified SkillRequirement interface
export interface SkillRequirement {
  skill: string;
  level?: string;
  name?: string;
}

// Create a unified EquityProject interface
export interface EquityProject {
  projectId: string;
  title: string;
  description?: string;
  equity: number;
  equityEarned: number;
  status: string;
  ticketId?: string;
  taskId?: string;
  completionPercentage?: number;
  // Compatibility properties
  id?: string;
  project_id?: string;
  equity_amount?: number;
  time_allocated?: any;
  start_date?: string;
  updated_at?: string;
  total_hours_logged?: number;
  skill_match?: number;
  created_by?: any;
  business_roles?: any;
  sub_tasks?: any[];
  created_at?: string;
  skills_required?: any[];
  skill_requirements?: any[];
  effort_logs?: any[];
  end_date?: string;
  documents?: {
    contract?: {
      url: string;
      status?: string;
    };
  };
  is_equity_project?: boolean;
  equity_allocation?: number;
  timeframe?: string;
}

// Create a unified Ticket interface that extends CoreTicket
export interface Ticket extends CoreTicket {
  description?: string; // Making description optional to match both interfaces
  completion_percentage?: number;
}

// Type for LogEffort since it's missing
export interface LogEffort {
  jobAppId: string;
  taskId: string;
  hours: number;
  description: string;
  date: Date;
  effortId?: string;
}

// Type for SubTask to fix imports
export interface SubTask {
  id: string;
  title: string;
  description?: string;
  equity_allocation: number;
  skill_requirements?: SkillRequirement[];
  status?: string;
  completion_percentage?: number;
  timeframe?: string;
}

// Type for Application
export interface Application {
  job_app_id: string;
  task_id: string;
  user_id: string;
  project_id?: string;
  status: string;
  message?: string;
  task_discourse?: string;
  created_at?: string;
  updated_at?: string;
  applied_at?: string;
  accepted_business?: boolean;
  accepted_jobseeker?: boolean;
  cv_url?: string;
  business_roles?: BusinessRole;
  task_title?: string;
  description?: string;
  company_name?: string;
  project_title?: string;
  profile?: any;
  skillMatch?: number;
  applicant_anonymized?: boolean;
}
