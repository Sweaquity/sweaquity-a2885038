
// Update JobApplication type to match required fields
import { Skill as BaseSkill, UserData } from './types';

export type EquityProject = {
  projectId: string;
  title: string;
  description?: string;
  equity: number;
  equityEarned: number;
  status: string;
  ticketId?: string;
  taskId?: string;
  completionPercentage?: number;
  // Add compatibility properties to fix existing references
  id?: string;
  project_id?: string;
  equity_amount?: number;
  time_allocated?: any;
  start_date?: string;
  updated_at?: string;
  total_hours_logged?: number;
  skill_match?: number;
  created_by?: any;
  business_roles?: any;
  sub_tasks?: any[];
  created_at?: string;
  skills_required?: any[];
  skill_requirements?: any[];
};

export interface JobApplication {
  job_app_id: string;
  task_id: string;
  applicant_id?: string;
  user_id: string;
  project_id?: string;
  status: string;
  message?: string;
  task_discourse?: string;
  created_at?: string;
  updated_at?: string;
  applied_at: string; // Make this required to match the expected type
  accepted_business?: boolean;
  accepted_jobseeker?: boolean;
  applicant_anonymized?: boolean;
  cv_url?: string;
  business_roles?: {
    id: string;
    title: string;
    description?: string;
    company_name?: string;
    project_title?: string;
    project_id?: string; // Add this for compatibility
    equity_allocation?: number;
    timeframe?: string;
    task_status?: string;
    project_status?: string;
    completion_percentage?: number;
    skill_requirements?: any[];
  };
  task_title?: string;
  description?: string;
  company_name?: string;
  project_title?: string;
  accepted_jobs?: any;
  hasEquityData?: boolean;
  notes?: string; // Add for compatibility
}

export interface LogEffort {
  jobAppId: string;
  taskId: string;
  hours: number;
  description: string;
  date: Date;
  effortId?: string;
}

export interface ParsedCVData {
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  careerHistory: Array<{
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
}

export interface ApplicationHistoryItem {
  id: string;
  title: string; 
  company: string;
  date: string;
  status: string;
}

// Define Skill directly in this file to avoid circular dependencies
export interface Skill {
  id?: string;
  skill: string;
  level?: string;
  years?: number;
  name?: string;
}

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  skills: Skill[];
  updated_at?: string;
  availability?: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  title?: string;
  phone?: string;
  address?: string;
  social_links?: any;
  marketing_consent?: boolean;
  project_updates_consent?: boolean;
  terms_accepted?: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  status?: string;
  assigned_to?: string;
  due_date?: string;
  start_date?: string;
  completion_percentage: number;
  equity_allocation?: number;
  timeframe?: string;
  skill_requirements?: any[];
}

export interface SkillRequirement {
  skill: string;
  level?: string;
}
