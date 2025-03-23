
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
  completion_percentage?: number;
}

// Update BetaTicket to explicitly include all required properties
export interface BetaTicket extends Ticket {
  task_id?: string;
  project_id?: string;
  job_app_id?: string;
  expanded?: boolean;
  isTaskTicket?: boolean;
  completion_percentage?: number;
}

// Add missing exported types that are referenced in the code
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
  highPriorityTickets?: number; // Added missing property
}

// Define UserData interface for profile data
export interface UserData {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  [key: string]: any; // Allow for additional properties
}
