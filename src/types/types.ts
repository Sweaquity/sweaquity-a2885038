
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
  ticket_type?: string; // Legacy property
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
  businessId?: string;
  onClose: () => void;
  onTaskAction?: (taskId: string, action: string, data: any) => Promise<void>;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  equity_agreed?: number; // Added field for equity data
  jobs_equity_allocated?: number; // Added field for equity data
}

export interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
  equity_agreed?: number; // Added for displaying equity data
  jobs_equity_allocated?: number; // Added for displaying equity data
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

export interface JobApplication {
  id: string; // Required field
  job_app_id?: string; // Making optional for compatibility
  role_id?: string;
  status: string;
  applied_at?: string;
  task_id?: string;
  project_id?: string;
  notes?: string;
  message?: string;
  cv_url?: string | null;
  task_discourse?: string;
  business_roles?: {
    title?: string;
    description?: string;
    company_name?: string;
    project_title?: string;
    timeframe?: string;
    skill_requirements?: any[];
    equity_allocation?: number;
    completion_percentage?: number;
    task_status?: string;
  };
  accepted_jobseeker?: boolean;
  accepted_business?: boolean;
  applicant_anonymized?: boolean;
  applicant_email?: string;
  user_id?: string;
  accepted_jobs?: {
    equity_agreed?: number;
    jobs_equity_allocated?: number;
    date_accepted?: string;
  };
}
