
import { SubTask } from './businessRoles';

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
    status?: string;
    task_status?: string;
    completion_percentage?: number;
    timeframe?: string;
    skill_requirements?: any[];
    project_status?: string;
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
  skill_match?: number;
  updated_at?: string;
  skills_required?: string[]; // Added for compatibility with ProjectCard
  is_equity_project?: boolean;
  timeframe?: string;
  equity_allocation?: number;
  description?: string;
}
