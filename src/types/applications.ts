
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
  applied_at: string; // Required for compatibility
  business_roles?: BusinessRole | any;
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
  hasEquityData?: boolean; // Added for compatibility with EquityProjectsList
  is_equity_project?: boolean; // Added for compatibility with EquityProjectsList
  profile?: any; // For accessing applicant profile data
  businesses?: any; // Added for business data compatibility
  nda_document_id?: string; // Added for NDA handling
  nda_status?: string; // Added for NDA status
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
  jobs_equity_allocated?: number; // Added for compatibility with UI
  work_contract_document_id?: string;
  work_contract_status?: string;
  award_agreement_document_id?: string;
  award_agreement_status?: string;
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
