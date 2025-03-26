
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
}

export interface TicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
}
