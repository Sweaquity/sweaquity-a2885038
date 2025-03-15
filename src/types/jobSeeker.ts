
// Profile types
export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  title?: string;
  location?: string;
  summary?: string;
  availability?: string;
  employment_preference?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  website_url?: string;
  cv_url?: string;
  profile_image?: string;
  skills?: Skill[];
  marketing_consent?: boolean;
  project_updates_consent?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Skill type - can be a string or an object with skill name and level
export type Skill = string | {
  skill: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
};

// Skill requirement type
export type SkillRequirement = string | {
  skill: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
};

// Application types
export interface JobApplication {
  id: string;
  job_app_id: string; // Added to match what components expect
  user_id: string;
  project_id: string;
  task_id?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  applied_at: string;
  cover_letter?: string;
  message?: string; // Added to match what components expect
  processed_at?: string;
  contract_url?: string;
  contract_status?: 'pending' | 'pending_signature' | 'signed' | 'rejected';
  notes?: string;
  cv_url?: string;
  applicant_anonymized?: boolean;
  applicant_email?: string;
  task_discourse?: string; // Added to match what components expect
  accepted_business?: boolean; // Added to match what components expect
  accepted_jobseeker?: boolean; // Added to match what components expect
  
  // Relations
  business_roles?: {
    title?: string;
    description?: string;
    timeframe?: string;
    skill_requirements?: SkillRequirement[];
    equity_allocation?: number;
    completion_percentage?: number;
    task_status?: string;
    company_name?: string;
    project_title?: string;
    project?: {
      title?: string;
      business?: {
        company_name?: string;
      };
    };
  };
  profiles?: any;
  project_sub_tasks?: any;
}

// Log effort interface
export interface LogEffort {
  projectId: string;
  hours: number;
  description: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status?: string;
  equity_allocation?: number;
  timeframe?: string;
  skill_requirements?: string[];
  progress?: number;
}

// Project types
export interface EquityProject {
  id?: string;
  project_id?: string;
  title: string;
  description?: string;
  status?: string;
  business_id?: string;
  equity_allocation?: number;
  equity_allocated?: number;
  skills_required?: string[];
  project_timeframe?: string;
  start_date?: string;
  end_date?: string;
  tasks?: SubTask[];
  business_roles?: any; // Changed to any from any[] to match component usage
  skill_match?: number;
  match_level?: 'high' | 'medium' | 'low' | 'none';
  matched_skills?: string[];
  missing_skills?: string[];
  equity_amount?: number; // Added to match what components expect
  time_allocated?: string; // Added to match what components expect
  effort_logs?: any[]; // Added to match what components expect
  total_hours_logged?: number; // Added to match what components expect
  created_by?: string; // Added to match what components expect
  sub_tasks?: SubTask[]; // Added to match what components expect
}

export interface SubTask {
  id?: string;
  task_id?: string;
  project_id?: string;
  title: string;
  description?: string;
  status?: string;
  task_status?: string;
  equity_allocation?: number;
  timeframe?: string;
  skill_requirements?: SkillRequirement[]; // Changed to match what components expect
  progress?: number;
  skill_match?: number;
  match_level?: 'high' | 'medium' | 'low' | 'none';
  matched_skills?: string[];
  missing_skills?: string[];
  completion_percentage?: number; // Added to match what components expect
}

// Parsed CV data
export interface ParsedCVData {
  skills: string[];
  career_history: CareerHistoryItem[];
  education: EducationItem[];
}

export interface CareerHistoryItem {
  title: string;
  company: string;
  duration: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  descriptionBullets?: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  location?: string;
  description?: string;
}

// User CV object
export interface UserCV {
  id: string;
  user_id: string;
  name: string;
  url: string;
  file_type: string;
  is_default: boolean;
  uploaded_at: string;
  size: number;
  parsed: boolean;
}

// Project document
export interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  url: string;
  file_type: string;
  uploaded_at: string;
  uploaded_by: string;
  size: number;
  status: string;
  version: number;
}

// Project with documents
export interface ProjectWithDocuments extends EquityProject {
  documents: ProjectDocument[];
  start_date?: string;
  end_date?: string;
  equity_amount?: number; // Added to match what components expect
  total_hours_logged?: number; // Added to match what components expect
}
