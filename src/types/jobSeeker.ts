
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

// Ensure EquityProject includes all necessary fields
export interface EquityProject {
  project_id: string;
  title: string;
  description: string;
  equity_allocation: number;
  project_timeframe: string;
  skills_required: any[];
  created_at: string;
  updated_at: string;
  business_id: string;
  status: string;
  tasks: any[];
  company_name: string;
  equity_allocated: number;
  completion_percentage: number;
  
  // Additional fields from other interfaces
  id?: string;
  equity_amount?: number;
  time_allocated?: string;
  start_date?: string;
  end_date?: string;
  effort_logs?: {
    date: string;
    hours: number;
    description: string;
  }[];
  total_hours_logged?: number;
  sub_tasks?: any[];
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
  documents?: {
    contract?: {
      url: string;
      status?: string;
    };
  };
  created_by?: string;
  skill_match?: number;
  is_equity_project?: boolean;
  timeframe?: string;
}
