
import { BusinessRole, SubTask } from './businessRoles';

export interface EffortLog {
  id: string;
  project_id: string;
  sub_task_id: string;
  user_id: string;
  hours: number;
  description: string;
  date_logged: string;
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
  job_app_id?: string;
  accepted_jobs?: {
    equity_agreed: number;
    jobs_equity_allocated: number;
    id: string;
    date_accepted: string;
  };
  created_at?: string; // Added for sorting by creation date
  updated_at?: string; // Added for compatibility
  documents?: {
    contract?: {
      url: string;
      status?: string;
    };
  };
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

// Component props
export interface EquityProjectItemProps {
  application: import('./applications').JobApplication;
  onApplicationUpdated: () => void;
}
