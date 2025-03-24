export interface Ticket {
  id: string;
  title: string;
  description: string;
  reporter?: string;
  assigned_to?: string;
  status: string;
  priority: string;
  health?: string;
  labels?: string[];
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  project_id?: string;
  task_id?: string;
  job_app_id?: string;
  expanded?: boolean;
  notes?: TicketNote[];
  newNote?: string;
  completion_percentage?: number;
  isTaskTicket?: boolean;
  isProjectTicket?: boolean;
  equity_points?: string;
}

export interface BetaTicket extends Ticket {
  task_id?: string;
  project_id?: string;
  job_app_id?: string;
  expanded?: boolean;
  isTaskTicket?: boolean;
  completion_percentage?: number;
}

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

export interface UserData {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  [key: string]: any;
}

export interface TicketNote {
  id: string;
  user: string;
  timestamp: string;
  content?: string;
  action?: string;
  comment?: string;
}
