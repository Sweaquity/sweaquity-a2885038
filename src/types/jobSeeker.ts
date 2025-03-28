
export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
  location?: string;
  title?: string;
  skills?: Skill[];
  cv_url?: string;
  social_links?: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
  };
  employment_preference?: string;
  availability?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id?: string;
  name: string;
  level?: 'beginner' | 'intermediate' | 'expert';
  years?: number;
  category?: string;
}

export interface EquityProject {
  id: string;
  project_id?: string;
  title?: string;
  description?: string;
  business_id?: string;
  company_name?: string;
  equity_allocation?: number;
  equity_allocated?: number;
  equity_amount?: number;
  equity_points?: number;
  timeframe?: string;
  skills_required?: string[] | object[];
  skill_requirements?: object[];
  project_timeframe?: string;
  estimated_hours?: number;
  status?: string;
  created_at?: string | null;
  updated_at?: string | null;
  completion_percentage?: number;
  start_date?: string;
  applicants_count?: number;
}

export interface JobApplication {
  job_app_id: string;
  user_id: string;
  project_id?: string;
  task_id?: string;
  status: string;
  message?: string;
  applied_at?: string;
  cv_url?: string;
  accepted_business?: boolean;
  accepted_jobseeker?: boolean;
  task_title?: string;
  project_title?: string;
  company_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  task_discourse?: string;
}

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  task_status?: string;
  equity_allocation?: number;
  timeframe?: string;
  estimated_hours?: number;
  dependencies?: string[];
  skills_required?: string[] | { skill: string, level: string }[];
  completion_percentage?: number;
  created_at?: string;
  updated_at?: string;
}
