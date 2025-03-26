
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
  onStatusChange?: (ticketId: string, newStatus: string) => void;
}

export interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTicket: (ticketData: any) => Promise<void>;
  projects: any[];
}

export interface DashboardTabProps {
  activeTab: string;
  profile: any;
  cvUrl: string;
  parsedCvData: any;
  onUpdateProfile: () => void;
  onUploadCV: (file: File) => Promise<void>;
  isUploading: boolean;
  skills: any[];
  onSkillsUpdate: (skills: any[]) => void;
  equityProjects: any[];
}

export interface ApplicationsTabProps {
  applications: any[];
  onApplicationUpdated: () => void;
}

export interface OpportunitiesTabProps {
  projects: any[];
  userSkills: any[];
}

export interface JobApplication {
  job_app_id: string;
  role_id?: string;
  status: string;
  applied_at: string;
  task_id: string;
  project_id: string;
  notes?: string;
  message?: string; 
  cv_url?: string | null;
  task_discourse?: string;
  business_roles?: {
    title: string;
    description: string;
    company_name?: string;
    project_title?: string;
    timeframe?: string;
    skill_requirements?: (string | any)[];
    equity_allocation?: number;
    completion_percentage?: number;
    task_status?: string;
  };
  id?: string;
  accepted_jobseeker?: boolean;
  accepted_business?: boolean;
  applicant_anonymized?: boolean;
  applicant_email?: string;
  user_id?: string;
  accepted_jobs?: {
    equity_agreed: number;
    jobs_equity_allocated?: number;
  };
  hours_logged?: number;
}
