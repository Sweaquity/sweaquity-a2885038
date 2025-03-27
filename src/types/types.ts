
// If this file doesn't exist, we'll create it with the necessary types

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string;
  assigned_to?: string;
  reporter?: string;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  notes?: any[];
  project_id?: string;
  job_app_id?: string;
  task_id?: string;
  completion_percentage?: number;
  equity_points?: number;
  estimated_hours?: number;
  hours_logged?: number;
  type?: string;  // Adding type property to the Ticket interface
}

export interface BetaTicket extends Ticket {
  health: string;
  // Additional beta-specific fields
}

export interface KanbanColumn {
  id: string;
  title: string;
  tickets: Ticket[];
}

// Add other needed interfaces
export interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateTicket: (ticket: any) => Promise<void>;
  projects: Array<{ project_id: string; project_title?: string; title?: string }>;
}

export interface TaskCompletionReviewProps {
  task: any;
  onClose: () => void;
  onTaskAction: (taskId: string, action: string, data: any) => Promise<void>;
}

export interface TicketStatistics {
  total: number;
  open: number;
  closed: number;
  highPriority: number;
}

export interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: string;
  isDisabled: boolean;
  styles?: {
    progressColor?: string;
    progressSelectedColor?: string;
  };
}
