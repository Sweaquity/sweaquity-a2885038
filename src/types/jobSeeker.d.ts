
// This file re-exports all job seeker related types for backward compatibility
// New code should import from the specific type files

export * from './profile';
export * from './businessRoles';
export * from './applications';
export * from './equity';
export * from './dashboardProps';

// Legacy Skill interface (updated to match profile.ts)
export interface Skill {
  id?: string;
  skill: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  name?: string; // Added for backward compatibility
}

// Legacy Profile interface (some code might still use this)
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  location: string;
  skills: Skill[];

  // Adding the missing properties from previous errors
  bio: string;
  phone: string;
  address: string;
  availability: string;
  social_links: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  marketing_consent: boolean;
  project_updates_consent: boolean;
  terms_accepted: boolean;
}

// Override the EquityProject interface for backward compatibility
export interface EquityProject {
  id: string;
  project_id: string;
  equity_amount: number;
  time_allocated: string;
  status: string;
  start_date: string;
  end_date?: string;
  effort_logs: {
    date: string;
    hours: number;
    description: string;
  }[];
  total_hours_logged: number;
  sub_tasks?: import('./businessRoles').SubTask[];
  business_roles?: {
    title: string;
    description: string;
    company_name?: string;
    project_title?: string;
  };
  title?: string;
  documents?: {
    contract?: {
      url: string;
      status?: string;
    };
  };
  created_by?: string;
  created_at?: string;
  skill_match?: number;
  updated_at?: string;
  skills_required?: string[];
  is_equity_project?: boolean;
  timeframe?: string;
  equity_allocation?: number;
  description?: string;
}

// Add JobApplication interface properties needed for compatibility
export interface JobApplication {
  job_app_id: string;
  id?: string;
  user_id: string;
  task_id: string;
  project_id?: string;
  applied_at: string;
  status: string;
  notes?: any;
  accepted_jobseeker: boolean;
  accepted_business: boolean;
  message?: string;
  cv_url?: string;
  task_discourse?: string;
  business_roles?: {
    title: string;
    description: string;
    company_name?: string;
    project_title?: string;
    status?: string;
    task_status?: string;
    completion_percentage?: number;
    timeframe?: string;
    skill_requirements?: any[];
    project_status?: string;
  };
  accepted_jobs?: AcceptedJob;
  is_equity_project?: boolean;
  applicant_skills?: string[];
  // Adding additional fields for enhanced features
  task_title?: string;
  company_name?: string;
  project_title?: string;
  description?: string;
  hasEquityData?: boolean;
}

// Update AcceptedJob to match the database fields
export interface AcceptedJob {
  equity_agreed: number;
  jobs_equity_allocated: number;
  date_accepted?: string;
  id?: string;
}
