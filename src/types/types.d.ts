
export interface Ticket {
  id: string;
  title: string;
  description: string; // Required field
  status: string;
  priority: string;
  ticket_type: string; // Make sure this exists
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
  type?: string; // Keep this for backward compatibility
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
  users?: any[];
  onReply?: (message: any) => Promise<void>;
  onStatusChange?: (status: any) => Promise<void>;
  onPriorityChange?: (priority: any) => Promise<void>;
  onAssigneeChange?: (userId: any) => Promise<void>;
  messages?: any[];
}

export interface TaskCompletionReviewProps {
  task: any;
  businessId?: string;
  onClose: () => void;
  onTaskAction?: (taskId: string, action: string, data: any) => Promise<void>;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface PendingApplicationItemProps {
  application: JobApplication;
  onAccept: (application: JobApplication) => Promise<void>;
  onWithdraw: (applicationId: string, reason?: string) => Promise<void>;
  isWithdrawing: boolean;
  getMatchedSkills: () => any;
  onApplicationUpdated?: () => void;
}

export interface ApplicationItemContentProps {
  description: any;
  message: string;
  discourse: string;
  appliedAt: string;
  onMessageClick?: () => void;
  onWithdrawClick?: () => void;
}
