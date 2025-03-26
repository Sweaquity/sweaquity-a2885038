
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health?: string;
  created_at?: string;
  updated_at?: string;
  reporter?: string;
  project_id?: string;
  job_app_id?: string;
  due_date?: string;
  assigned_to?: string;
  completion_percentage?: number;
  estimated_hours?: number;
  hours_logged?: number;
  notes?: any[];
  task_id?: string;
  ticket_type?: string;
  type?: string;
  equity_points?: number;
  replies?: any[];
}

export interface TicketMessage {
  id: string;
  user: string;
  timestamp: string;
  comment: string;
}

export interface PendingApplicationsListProps {
  applications: JobApplication[];
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
}

export interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
  messages?: any[];
  onReply?: (message: any) => Promise<void>;
  onStatusChange?: (status: any) => Promise<void>;
  onPriorityChange?: (priority: any) => Promise<void>;
  onAssigneeChange?: (userId: any) => Promise<void>;
  users?: any[];
}

export interface TicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
}

export interface TicketDashboardProps {
  tickets?: Ticket[];
  initialTickets?: Ticket[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  handleTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId?: string;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  columns?: Array<{
    field: string;
    header: string;
    render?: (ticket: Ticket) => React.ReactNode;
  }>;
  cardStats?: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  showTimeLogDialog?: boolean;
}

export interface TimeLogDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  ticket?: Ticket;
  userId?: string;
}

export interface TaskCompletionReviewProps {
  task: any;
  businessId?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
}

export interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketClick?: (ticket: Ticket) => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  projectId?: string;
}
