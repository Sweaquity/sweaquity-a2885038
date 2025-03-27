export interface Ticket {
  id: string;
  title: string;
  description: string; // Required field
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
    content?: string;
    action?: string;
    comment?: string;
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
  isProjectTicket?: boolean;
  completion_percentage?: number;
  estimated_hours?: number;
  hours_logged?: number;
  type?: string; // Added type property
  // Legacy property to ensure backward compatibility:
  ticket_type?: string;
}

// BetaTicket interface with all required properties
export interface BetaTicket extends Ticket {
  task_id?: string;
  project_id?: string;
  job_app_id?: string;
  expanded?: boolean;
  isTaskTicket?: boolean;
  isProjectTicket?: boolean;
  completion_percentage?: number;
  health: string; // Making health required for BetaTicket
  type?: string; // Added type property
}

// Task interface for project tasks
export interface Task {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  projectId?: string;
  equity?: number;
  completion?: number;
  start?: Date;
  end?: Date;
  progress?: number;
  type?: string;
  isDisabled?: boolean;
  // Add the name property for compatibility with gantt-task-react
  name?: string;
}

export interface TaskType {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

export interface DragResult {
  destination?: {
    droppableId: string;
    index: number;
  };
  source: {
    droppableId: string;
    index: number;
  };
  draggableId: string;
}

export interface TicketStatistics {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  backlog?: number;
  review?: number;
  totalTickets?: number;
  openTickets?: number;
  closedTickets?: number;
  highPriorityTickets?: number;
  byStatus?: Record<string, number>;
  byPriority?: Record<string, number>;
}

// Define UserData interface for profile data
export interface UserData {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  [key: string]: any; // Allow for additional properties
}

export interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId: string;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
}

export interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateTicket: (ticketData: any) => Promise<void>;
  projects: any[];
}

export interface TaskCompletionReviewProps {
  task: any;
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
}

export interface TimeLogDialogProps {
  ticket: Ticket;
  userId: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export interface TicketDetailsProps {
  ticket: Ticket;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onClose?: () => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
}
