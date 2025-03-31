
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
}

export interface LogEffort {
  project_id: string;
  hours: number;
  description: string;
}

export interface SubTask {
  task_id: string; // Add this to match your database schema
  project_id: string;
  title: string;
  description: string;
  completion_percentage: number;
  // ... any other existing properties
}
