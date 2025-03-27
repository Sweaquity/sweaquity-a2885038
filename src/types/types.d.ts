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

export interface TaskCompletionReviewProps {
  task: any;
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
  businessId?: string; // Added optional businessId prop
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
  messages?: any[]; // Added optional messages prop
  onReply?: (message: any) => Promise<void>; // Added optional onReply prop
  onStatusChange?: (status: any) => Promise<void>; // Added optional onStatusChange prop
  onPriorityChange?: (priority: any) => Promise<void>; // Added optional onPriorityChange prop
  onAssigneeChange?: (userId: any) => Promise<void>; // Added optional onAssigneeChange prop
  users?: any[]; // Added optional users prop
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

export interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
  messages?: any[]; // Added optional messages prop
  onReply?: (message: any) => Promise<void>; // Added optional onReply prop
  onStatusChange?: (status: any) => Promise<void>; // Added optional onStatusChange prop
  onPriorityChange?: (priority: any) => Promise<void>; // Added optional onPriorityChange prop
  onAssigneeChange?: (userId: any) => Promise<void>; // Added optional onAssigneeChange prop
  users?: any[]; // Added optional users prop
}
