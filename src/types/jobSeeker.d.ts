
export interface SkillRequirement {
  skill: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface BusinessRole {
  title: string;
  description: string;
  timeframe: string;
  skill_requirements: SkillRequirement[] | string[];
  equity_allocation: number;
  completion_percentage: number;
  task_status: string;
  company_name: string;
  project_title: string;
}

export interface AcceptedJob {
  equity_agreed: number;
  jobs_equity_allocated: number;
  date_accepted?: string;
}

export interface JobApplication {
  job_app_id: string;
  id?: string;
  user_id: string;
  task_id: string;
  project_id?: string;
  applied_at: string;
  status: string;
  notes?: any;
  accepted_jobseeker: boolean;
  accepted_business: boolean;
  message?: string;
  cv_url?: string;
  task_discourse?: string;
  business_roles?: BusinessRole;
  accepted_jobs?: AcceptedJob;
  is_equity_project?: boolean;
}

export interface EquityProject {
  title: string;
  description: string;
  equity_allocation: number;
  timeframe: string;
  company_name: string;
  projectId: string;
  id: string;
  skills: string[];
  status: string;
}
