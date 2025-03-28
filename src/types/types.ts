
// We only need to add the missing fields to the Ticket interface
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string; // Make health required to match BetaTicket requirement
  assignee?: string;
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
  task: any;
  onReviewComplete: () => void;
  onClose: () => void;
  open: boolean; // Add missing property
  setOpen: React.Dispatch<React.SetStateAction<boolean>>; // Add missing property
  businessId?: string; // Add missing property
}

export interface TicketStatistics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  completedTickets: number;
  overdueTickets: number;
  total?: number; // Add this property to fix errors
}

export interface BetaTicket extends Ticket {
  health: string; // Already required in Ticket now
}
