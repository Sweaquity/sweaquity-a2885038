
import { Skill } from './profile';

export interface BusinessRole {
  id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  timeframe?: string;
  equity_allocation?: number;
  skill_requirements?: Skill[] | string[];
  company_name?: string;
  project_title?: string;
  task_status?: string;
  completion_percentage?: number;
}

export interface SkillRequirement {
  skill: string;
  level?: string;
}

export interface SubTask {
  id: string;
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  timeframe: string;
  status: string;
  equity_allocation: number;
  skill_requirements: Skill[];
  task_status: string;
  completion_percentage: number;
}
