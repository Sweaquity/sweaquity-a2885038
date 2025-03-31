
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
  project_status?: string; // Added for compatibility with ApplicationsList
}

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  equity_allocation: number;
  skills_required?: string[];
  timeframe?: string;
  completion_percentage?: number;
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
