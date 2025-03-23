
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  reporter?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  notes?: Array<{
    id: string;
    user: string;
    timestamp: string;
    content: string;
  }>;
  expanded?: boolean;
  newNote?: string;
  system_info?: string;
  reproduction_steps?: string;
  health?: string;
  replies?: any[];
  project_id?: string;
  task_id?: string;
  job_app_id?: string;
  equity_points?: number;
  isTaskTicket?: boolean;
  completion_percentage?: number;
}
