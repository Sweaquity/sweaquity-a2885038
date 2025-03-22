
// types.ts
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  reporter_email?: string;
  reporter?: string;
  expanded?: boolean;
  newNote?: string;
  assigned_to?: string;
  task_id?: string;
  job_app_id?: string;
  project_id?: string;
  notes?: Array<{
    action: string;
    user: string;
    timestamp: string;
    comment?: string;
  }> | null;
  system_info?: {
    url: string;
    userAgent: string;
    timestamp: string;
    viewportSize: string;
    referrer: string;
  };
  reported_url?: string;
  attachments?: string[];
  reproduction_steps?: string;
}

export interface TicketStatistics {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  byStatus: { [key: string]: number };
  byPriority: { [key: string]: number };
}

export interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  type: TaskType;
  progress: number;
  isDisabled: boolean;
  styles?: {
    progressColor?: string;
    backgroundColor?: string;
  };
}

export type TaskType = 'task' | 'milestone' | 'project';

export interface KanbanColumn {
  id: string;
  title: string;
  ticketIds: string[];
}

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
  reason: 'DROP';
}

export interface ApplicationStats {
  totalUsers: number;
  totalBusinesses: number;
  totalProjects: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  withdrawnApplications: number;
  rejectedApplications: number;
  openTasks: number;
  completedTasks: number;
}
