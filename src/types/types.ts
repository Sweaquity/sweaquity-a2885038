// We only need to add the missing fields to the Ticket interface
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string; // Make health required to match BetaTicket requirement
  assigned_to?: string;
  created_by: string; // Make required to fix TypeScript error
  created_at: string; // Make required to fix TypeScript error
  project_id: string;
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
  accepted_jobs?: {
    equity_agreed: number;
    jobs_equity_allocated: number;
    id: string;
    date_accepted: string;
  };
}

// Update UserData interface to include the required name field
export interface UserData {
  id: string;
  name: string; // Required field
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
  total?: number; // For backward compatibility
  open?: number; // For backward compatibility
}

export interface BetaTicket extends Ticket {
  health: string; // Already required in Ticket now
}

// Update TicketDashboardProps to include userCanEditDates and userCanEditStatus
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
}
