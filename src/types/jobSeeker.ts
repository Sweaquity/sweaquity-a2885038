
// Update JobApplication type to match required fields
import { Skill, UserData } from './types';

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
  };
  task_title?: string;
  description?: string;
  company_name?: string;
  project_title?: string;
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
