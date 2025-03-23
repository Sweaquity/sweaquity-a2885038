
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

// Add missing exported types that are referenced in the code
export interface Task {
  id: string;
  title: string;
  // Add other properties as needed
}

export interface TaskType {
  id: string;
  name: string;
  // Add other properties as needed
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
  // Add other properties as needed
}
