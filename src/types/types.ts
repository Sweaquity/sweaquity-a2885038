
// Update Ticket interface to fix inconsistencies
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string; 
  assigned_to?: string;
  created_by?: string;
  created_at?: string;
  project_id?: string;
  due_date?: string;
  ticket_type?: string;
  task_id?: string;
  completion_percentage?: number;
  estimated_hours?: number;
  hours_logged?: number;
  updated_at?: string;
  notes?: any[];
  type?: string;
  equity_points?: number;
  reporter?: string;
  expanded?: boolean;
  newNote?: string;
  system_info?: string | object;
  reproduction_steps?: string;
  replies?: any[];
  job_app_id?: string;
  isTaskTicket?: boolean;
  isProjectTicket?: boolean;
  attachments?: string[];
}

// Update UserData interface to include the required name field
export interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  dependencies?: string[];
  hours_logged?: number;
}

export interface TaskCompletionReviewProps {
  task?: any;
  onReviewComplete?: () => void;
  onClose?: () => void;
  open?: boolean; 
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>; 
  businessId?: string;
}

export interface TicketStatistics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  completedTickets: number;
  overdueTickets: number;
  total?: number;
  open?: number;
}

export interface BetaTicket extends Ticket {
  // health is already required in Ticket now
}

// Add TicketDashboardProps with optional expandedTickets and toggleTicketExpansion
export interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId?: string;
  onLogTime?: (ticketId: string) => void;
  userCanEditDates?: boolean;
  userCanEditStatus?: boolean;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  expandedTickets?: Set<string> | Record<string, boolean>;
  toggleTicketExpansion?: (ticketId: string) => void;
}
