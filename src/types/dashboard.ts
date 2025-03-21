
export type TaskType = 'task' | 'milestone' | 'project';

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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'ticket' | 'application' | 'system';
  createdAt: string;
  read: boolean;
  relatedId?: string;
  sender?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  recipientId: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
  related_ticket?: string;
  sender?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  content?: string;
}

export interface ExpandedTicketDetailsProps {
  ticket: any;
  messages: any[];
  hoursLogged?: any;
  onAction: (ticketId: string, action: string, data?: any) => void;
}
