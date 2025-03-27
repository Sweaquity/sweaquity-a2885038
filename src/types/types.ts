
// If this file doesn't exist, we'll create it with the necessary types

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string;
  assigned_to?: string;
  reporter?: string;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  notes?: any[];
  project_id?: string;
  job_app_id?: string;
  task_id?: string;
  completion_percentage?: number;
  equity_points?: number;
  estimated_hours?: number;
  hours_logged?: number;
  type?: string;  // Keeping for backward compatibility
  ticket_type?: string;  // Adding ticket_type property to the Ticket interface
}

export interface BetaTicket extends Ticket {
  health: string;
  // Additional beta-specific fields
}

export interface KanbanColumn {
  id: string;
  title: string;
  tickets: Ticket[];
}

// Add other needed interfaces
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

// Add missing ApplicationItemContentProps
export interface ApplicationItemContentProps {
  description?: string;
  message?: string;
  discourse?: string;
  appliedAt?: string;
  onMessageClick?: () => void;
  onWithdrawClick?: () => void;
  onViewProject?: () => void;
  onViewDetails?: () => void;
}

// Add missing PendingApplicationsListProps
export interface PendingApplicationsListProps {
  applications: JobApplication[];
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
  getMatchedSkills?: (application: JobApplication) => { matched: string[], total: number, matchPercentage: number };
}

// Add JobApplication interface if not already present
export interface JobApplication {
  job_app_id: string;
  user_id: string;
  task_id: string;
  status: string;
  message?: string;
  applied_at?: string;
  project_id?: string;
  business_roles?: {
    title?: string;
    description?: string;
    company_name?: string;
    project_title?: string;
  };
  task_discourse?: string;
  notes?: any[];
}

// Update ExpandedTicketDetailsProps to include users property
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

// Add ApplicationsTabProps
export interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
  newMessagesCount?: number;
}

// Update DashboardTabProps
export interface DashboardTabProps {
  activeTab: string;
  profile: any;
  cvUrl: string;
  parsedCvData: any;
  skills: Skill[];
  onSkillsUpdate: (skills: Skill[]) => void;
  equityProjects: EquityProject[];
  userCVs?: any[];
  onCvListUpdated?: () => void;
}

// Add Skill and EquityProject interfaces if not already present
export interface Skill {
  skill: string;
  level: string;
}

export interface EquityProject {
  id: string;
  project_id: string;
  equity_amount: number;
  time_allocated: string;
  status: string;
  start_date: string;
  end_date?: string;
  effort_logs?: any[];
  total_hours_logged: number;
  title?: string;
  created_at?: string;
  updated_at?: string;
}
