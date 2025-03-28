
// This file re-exports all job seeker related types for backward compatibility
// New code should import from the specific type files

export * from './profile';
export * from './businessRoles';
export * from './applications';
export * from './equity';
export * from './dashboardProps';

// Add any legacy types that are not covered by the new files
// but are needed for backward compatibility below:

// Legacy Profile interface (some code might still use this)
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  location: string;
  skills: Skill[];
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
  skill_match?: number;
  updated_at?: string;
}
