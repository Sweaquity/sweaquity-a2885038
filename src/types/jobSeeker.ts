
// Add necessary imports and type definitions

export interface SkillRequirement {
  skill: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface LogEffort {
  projectId: string;
  hours: number;
  description: string;
}

export interface SubTask {
  task_id: string;
  id?: string; // For compatibility with existing code
  title: string;
  description: string;
  completion_percentage: number;
  timeframe?: string;
  equity_allocation?: number;
  task_status?: string;
  skill_requirements?: SkillRequirement[] | string[];
}

export interface EquityProject {
  id: string;
  project_id?: string; // For compatibility with existing code
  title: string;
  status: string;
  equity_amount: number;
  time_allocated: string;
  total_hours_logged?: number;
  sub_tasks?: SubTask[];
  start_date?: string;
  end_date?: string;
  business_roles?: any; // For compatibility with business roles data
  skill_match?: number;
}

export interface JobApplication {
  job_app_id: string;
  id?: string; // For compatibility with existing code
  user_id: string;
  task_id: string;
  project_id?: string;
  status: string;
  applied_at: string;
  message?: string;
  notes?: string;
  cv_url?: string;
  task_discourse?: string;
  accepted_business?: boolean;
  accepted_jobseeker?: boolean;
  applicant_anonymized?: boolean;
  applicant_email?: string;
  business_roles?: {
    title: string;
    description: string;
    timeframe: string;
    skill_requirements: SkillRequirement[] | string[];
    equity_allocation?: number;
    completion_percentage?: number;
    task_status?: string;
    company_name?: string;
    project_title?: string;
  };
}

export interface Skill {
  skill: string;
  level?: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface Profile {
  id?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  bio?: string;
  phone?: string;
  cv_url?: string;
  location?: string;
  address?: string;
  availability?: string[] | string;
  employment_preference?: 'salary_only' | 'equity_only' | 'both';
  skills?: Skill[];
  social_links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
  };
  terms_accepted?: boolean;
  marketing_consent?: boolean;
  project_updates_consent?: boolean;
  created_at?: string;
  updated_at?: string;
}
