
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
  type?: string;  // This property exists for backward compatibility
  ticket_type?: string; // Adding this property to match the database schema
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

export interface KanbanBoardProps {
  onStatusChange: (ticketId: any, newStatus: any) => Promise<void>;
  onTicketClick: (ticket: Ticket) => void;
  tickets: Ticket[];
}

export interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
}

export interface ExpandedTicketDetailsProps {
  ticket: any;
  onReply: (message: any) => Promise<void>;
  onStatusChange: (status: any) => Promise<void>;
  onPriorityChange: (priority: any) => Promise<void>;
  onAssigneeChange: (userId: any) => Promise<void>;
  users: any[];
  messages?: any[];
}
