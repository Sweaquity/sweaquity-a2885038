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
  level: string;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  status: string;
  equity_allocation: number;
  skill_requirements: string[];
  skills_required: string[];
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
  effort_logs: EffortLog[];
  total_hours_logged: number;
  title: string;
  sub_tasks: SubTask[];
}

export interface EffortLog {
  date: string;
  hours: number;
  description: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  task_id: string;
  status: string;
  message: string;
  cv_url: string | null;
  applied_at: string;
  business_roles?: {
    title: string;
    description: string;
  };
  role_id?: string;
}
