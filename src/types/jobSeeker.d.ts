
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  location: string;
  skills: Skill[];
}

export interface Skill {
  skill: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface SubTask {
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  skill_requirements: SkillRequirement[];
  equity_allocation: number;
  timeframe: string;
  status: string;
  task_status: string;
  completion_percentage: number;
  id: string; // Adding this for backward compatibility
}

export interface EquityProject {
  id: string;
  project_id: string;
  equity_amount: number;
  time_allocated: string;
  status: string;
  start_date: string;
  end_date?: string;
  effort_logs: {
    date: string;
    hours: number;
    description: string;
  }[];
  total_hours_logged: number;
  sub_tasks?: SubTask[];
  business_roles?: {
    title: string;
    description: string;
    company_name?: string;
    project_title?: string;
  };
  title?: string;
  documents?: {
    contract?: {
      url: string;
      status?: string;
    };
  };
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  skill_match?: number;
  job_app_id?: string;
  applied_at?: string;
}

export interface EffortLog {
  date: string;
  hours: number;
  description: string;
}

export interface JobApplication {
  job_app_id: string;
  role_id?: string;
  status: string;
  applied_at: string;
  task_id: string;
  project_id: string;
  notes?: string;
  message?: string; 
  cv_url?: string | null;
  task_discourse?: string;
  business_roles?: {
    title: string;
    description: string;
    company_name?: string;
    project_title?: string;
    timeframe?: string;
    skill_requirements?: (string | SkillRequirement)[];
    equity_allocation?: number;
    completion_percentage?: number;
    task_status?: string;
  };
  id?: string; // Adding this for backward compatibility
  accepted_jobseeker?: boolean;
  accepted_business?: boolean;
  applicant_anonymized?: boolean;
  applicant_email?: string;
  user_id?: string; // Adding user_id to match database schema
  accepted_jobs?: {
    equity_agreed: number;
    jobs_equity_allocated?: number;
  };
  hours_logged?: number;
}

export interface ExtendedJobApplication extends JobApplication {
  accepted_jobs?: {
    equity_agreed: number;
    jobs_equity_allocated?: number;
  };
}

export interface SkillRequirement {
  skill: string;
  level?: string;
}

export interface EquityProjectItemProps {
  application: JobApplication;
  onApplicationUpdated?: () => void;
}
