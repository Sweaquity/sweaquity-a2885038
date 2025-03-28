
// We only need to add the missing fields to the Ticket interface
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: string;
  created_by: string;
  created_at: string;
  project_id: string;
  due_date?: string;
  ticket_type?: string; // Add the missing ticket_type field
  task_id?: string; // Add the missing task_id field
  completion_percentage?: number; // Add completion_percentage
  estimated_hours?: number; // Add estimated_hours
  hours_logged?: number; // Add hours_logged
  updated_at?: string; // Add updated_at
  notes?: any[]; // Add notes field
  type?: string; // Add type field
  equity_points?: number; // Add equity_points
  health?: string; // Add health field
}

// Add missing exported types
export interface TicketStatistics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  completedTickets: number;
  overdueTickets: number;
}

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
}

export interface TaskCompletionReviewProps {
  task: any;
  onReviewComplete: () => void;
  onClose: () => void;
}

export interface BetaTicket extends Ticket {
  health: string; // Required for BetaTicket
}
