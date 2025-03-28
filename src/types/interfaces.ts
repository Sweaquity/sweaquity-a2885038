
// Consolidated type definitions for the entire application

export interface Ticket {
  id: string;
  title: string;
  description: string; // Making this required as most usages treat it as required
  status: string;
  priority: string;
  health: string;
  type: string; // Standardized on 'type' instead of 'ticket_type'
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
  expanded?: boolean; // Optional UI state property
  newNote?: string; // Optional UI state property
  system_info?: string;
  reproduction_steps?: string;
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
  // Legacy property for backward compatibility:
  ticket_type?: string; 
}

export interface BetaTicket extends Ticket {
  // Additional beta-specific fields
}

export interface TicketMessage {
  id: string;
  user: string;
  timestamp: string;
  comment: string;
}

export interface JobApplication {
  id: string;
  status: string;
  user_id?: string;
  task_id?: string;
  applied_at?: string;
  created_at?: string;
  updated_at?: string;
  project_id?: string;
  accepted_jobseeker?: boolean;
  accepted_business?: boolean;
  applicant_anonymized?: boolean;
  applicant_id?: string;
  message?: string;
  cv_url?: string;
  task_discourse?: string;
  // Adding fields found in other JobApplication interfaces
  job_app_id?: string;
  task_title?: string;
  company_name?: string;
  project_title?: string;
  description?: string;
  skills_required?: string[];
  applicant_skills?: string[];
  business_roles?: any;
}

export interface PendingApplicationsListProps {
  applications: JobApplication[];
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
}

export interface PendingApplicationItemProps {
  application: JobApplication;
  onAccept?: (application: JobApplication) => Promise<void>;
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  isWithdrawing?: boolean;
  getMatchedSkills?: () => any;
  onApplicationUpdated?: () => void;
}

export interface ApplicationItemContentProps {
  description: string;
  message: string;
  discourse: string;
  appliedAt: string;
  onMessageClick?: () => void;
  onWithdrawClick?: () => void;
}

export interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
  messages?: any[]; // Adding missing prop seen in errors
  onReply?: (message: any) => Promise<void>; // Adding missing prop
  onStatusChange?: (status: any) => Promise<void>; // Adding missing prop
  onPriorityChange?: (priority: any) => Promise<void>; // Adding missing prop
  onAssigneeChange?: (userId: any) => Promise<void>; // Adding missing prop
  users?: any[]; // Adding missing prop
}

export interface KanbanColumn {
  id: string;
  title: string;
  tickets: Ticket[];
}

export interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateTicket: (ticket: any) => Promise<void>;
  projects: Array<{ project_id: string; project_title?: string; title?: string }>;
}

export interface TaskCompletionReviewProps {
  task: any;
  businessId?: string;
  onClose: () => void;
  onTaskAction?: (taskId: string, action: string, data: any) => Promise<void>;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface TicketStatistics {
  total: number;
  open: number;
  closed: number;
  highPriority: number;
}

export interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: string;
  isDisabled: boolean;
  styles?: {
    progressColor?: string;
    progressSelectedColor?: string;
  };
}

export interface EquityProject {
  id: string;
  title: string;
  description?: string;
  status?: string;
  completion_percentage?: number;
  equity_allocation?: number;
  equity_earned?: number;
  tasks?: any[];
  created_at?: string;
  updated_at?: string; // Added missing field
}

export interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  showEstimatedHours?: boolean; // Added missing prop
  userId: string;
  onLogTime?: (ticketId: string, hours?: number, description?: string) => void; // Updated signature
  userCanEditDates?: boolean; // Added missing prop
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
