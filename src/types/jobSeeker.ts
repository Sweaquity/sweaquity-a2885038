
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
  title: string;
  description: string;
  completion_percentage: number;
}

export interface EquityProject {
  id: string;
  title: string;
  status: string;
  equity_amount: number;
  time_allocated: string;
  total_hours_logged?: number;
  sub_tasks?: SubTask[];
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
  task_discourse?: string;
  accepted_business?: boolean;
  accepted_jobseeker?: boolean;
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
