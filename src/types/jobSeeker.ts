
import { UserData } from './types';
import { 
  Skill,
  JobApplication,
  LogEffort,
  EquityProject,
  SkillRequirement
} from './consolidatedTypes';

export type { 
  Skill,
  JobApplication,
  LogEffort,
  EquityProject,
  SkillRequirement
};

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
