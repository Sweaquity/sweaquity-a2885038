
export interface JobApplication {
  job_app_id: string;
  role_id: string;
  status: string;
  applied_at: string;
  task_id: string;
  project_id: string;
  notes: string;
  message: string; 
  cv_url: string | null;
  business_roles?: {
    title: string;
    description: string;
    company_name?: string;
    project_title?: string;
    timeframe?: string;
    skills_required?: string[];
    skill_requirements?: (string | SkillRequirement)[];
    equity_allocation?: number;
  };
  id: string; // Adding this for backward compatibility
}

export interface SkillRequirement {
  skill: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface SubTask {
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  skills_required: string[];
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
  created_by?: string; // Added missing property
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  location: string | null;
}

export interface Skill {
  skill: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface LogEffort {
  projectId: string;
  hours: number;
  description: string;
}
