
export interface Skill {
  skill: string;
  level?: string;
}

export interface Profile {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  bio?: string;
  phone?: string;
  address?: string;
  location?: string;
  availability?: string;
  cv_url?: string;
  marketing_consent?: boolean;
  project_updates_consent?: boolean;
  terms_accepted?: boolean;
  is_anonymized?: boolean;
  anonymized_at?: string;
  skills?: Skill[];
  social_links?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  created_at?: string;
  updated_at?: string;
}

export interface BusinessRole {
  id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  timeframe?: string;
  equity_allocation?: number;
  skill_requirements?: Skill[] | string[];
  company_name?: string;
  project_title?: string;
  task_status?: string;
  completion_percentage?: number;
}

export interface JobApplication {
  job_app_id: string;
  user_id: string;
  task_id: string;
  project_id?: string;
  status: string;
  message?: string;
  cv_url?: string;
  accepted_jobseeker?: boolean;
  accepted_business?: boolean;
  applicant_anonymized?: boolean;
  created_at?: string;
  updated_at?: string;
  applied_at?: string;
  business_roles?: BusinessRole;
  applicant_id?: string;
  task_discourse?: string;
  id?: string; // Add id field for compatibility
  notes?: any[]; // Add notes field for compatibility
}

// Add SkillRequirement for compatibility with existing code
export interface SkillRequirement {
  skill: string;
  level?: string;
}

export interface SubTask {
  id: string;
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  timeframe: string;
  status: string;
  equity_allocation: number;
  skill_requirements: Skill[];
  task_status: string;
  completion_percentage: number;
}

export interface EffortLog {
  id: string;
  project_id: string;
  sub_task_id: string;
  user_id: string;
  hours: number;
  description: string;
  date_logged: string;
}

export interface EquityProject {
  id: string;
  project_id: string;
  equity_amount: number;
  time_allocated: string;
  status: string;
  start_date: string;
  end_date?: string;
  effort_logs: EffortLog[];
  total_hours_logged: number;
  title: string;
  company_name?: string;
  created_by?: string;
  skill_match?: number;
  sub_tasks?: SubTask[];
  business_roles?: BusinessRole;
}

export interface ProjectEquity {
  project_id: string;
  user_id: string;
  equity_allocated: number;
  equity_earned: number;
  completion_percentage: number;
  status: string;
  updated_at: string;
}

export interface LogEffort {
  projectId: string;
  hours: number;
  description: string;
}

export interface AcceptedJob {
  id: string;
  job_app_id: string;
  equity_agreed: number;
  date_accepted: string;
  document_url?: string;
  accepted_discourse?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  ticket_id: string;
  user_id: string;
  job_app_id?: string;
  start_time: string;
  end_time?: string;
  hours_logged: number;
  description: string;
  created_at: string;
}
