
import { BusinessRole } from './businessRoles';

export interface JobApplication {
  job_app_id: string;
  user_id: string;
  task_id: string;
  project_id?: string;
  status: string;
  message?: string;
  cv_url?: string;
  accepted_jobseeker?: boolean;
  accepted_business?: boolean;
  applicant_anonymized?: boolean;
  created_at?: string;
  updated_at?: string;
  applied_at?: string;
  business_roles?: BusinessRole;
  applicant_id?: string;
  task_discourse?: string;
  id?: string; // Add id field for compatibility
  notes?: any[]; // Add notes field for compatibility
  hours_logged?: number; // Added for time tracking
  accepted_jobs?: {
    equity_agreed: number;
    jobs_equity_allocated: number;
    id: string;
    date_accepted: string;
  };
  // For compatibility with UI components
  company_name?: string;
  project_title?: string;
  task_title?: string;
  description?: string;
  skills_required?: string[];
  applicant_skills?: string[];
}

export interface AcceptedJob {
  id: string;
  job_app_id: string;
  equity_agreed: number;
  date_accepted: string;
  document_url?: string;
  accepted_discourse?: string;
  created_at: string;
  updated_at: string;
}

// Application component props
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
  getMatchedSkills: () => string[];
  onApplicationUpdated?: () => void;
}

export interface ApplicationsTabBaseProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
  newMessagesCount?: number;
}
