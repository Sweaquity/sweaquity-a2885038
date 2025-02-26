
export interface JobApplication {
  id: string;
  role_id: string;
  status: string;
  applied_at: string;
  notes: string;
  business_roles?: {
    title: string;
    description: string;
  };
  task?: {
    title: string;
    description: string;
    equity_allocation: number;
    timeframe: string;
  };
  project?: {
    title: string;
    description: string;
    business_id: string;
  };
}

export interface SkillRequirement {
  skill: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface SubTask {
  id: string;
  project_id: string;  // Added this line to fix the TypeScript error
  title: string;
  description: string;
  skills_required: string[];
  skill_requirements: SkillRequirement[];
  equity_allocation: number;
  timeframe: string;
  status: string;
  task_status: string;
  completion_percentage: number;
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
  };
  title?: string;
}

export interface Profile {
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
