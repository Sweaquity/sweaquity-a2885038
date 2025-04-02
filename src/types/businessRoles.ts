import { Skill, SkillRequirement } from './profile';

export interface BusinessRole {
  id?: string;
  title: string;
  description: string;
  company_name?: string;
  project_title?: string;
  status?: string;
  task_status?: string;
  completion_percentage?: number;
  timeframe?: string;
  skill_requirements?: Array<SkillRequirement | string>;
  equity_allocation?: number;
  project?: {
    title?: string;
    description?: string;
    status?: string;
  };
  project_id?: string; // Added for compatibility with components
  project_status?: string; // Added for compatibility with ApplicationsList
}

export interface SubTask {
  task_id?: string | null; 
  id?: string; // Added for compatibility
  project_id: string;
  title: string;
  description: string;
  equity_allocation?: number | null;
  status?: string | null;
  task_status?: string | null;
  skill_requirements?: Array<SkillRequirement | string> | null;
  skill_required?: string | null;
  skills_required?: string[]; // Added for compatibility
  timeframe?: string | null;
  created_by?: string | null;
  completion_percentage: number;
  dependencies?: string | null;
  last_activity_at?: string | null;
  estimated_hours?: number | null;
}

export interface BusinessProjectBasic {
  project_id: string;
  title: string;
  description?: string;
  skills_required?: string[];
  equity_allocation?: number;
  status?: string;
  completion_percentage?: number;
  business_id?: string;
  created_at?: string;
}
