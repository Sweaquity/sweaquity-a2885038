
import { EquityProject, LogEffort } from './equity';
import { JobApplication } from './applications';
import { Skill } from './profile';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  email: string;
  location?: string;
  bio?: string;
  phone?: string;
  address?: string;
  availability?: string;
  social_links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
  };
  skills: Skill[];
  marketing_consent?: boolean;
  project_updates_consent?: boolean;
  terms_accepted?: boolean;
  cv_url?: string;
}

export interface DashboardTabProps {
  activeTab: string;
  profile: Profile;
  cvUrl: string;
  parsedCvData: any;
  skills: Skill[];
  onSkillsUpdate: (skills: Skill[]) => void;
  equityProjects: EquityProject[];
  userCVs?: any[];
  onCvListUpdated?: () => void;
}

// Adding component-specific props
export interface ApplicationHeaderProps {
  title?: string;
  company?: string;
  project?: string;
  status?: string;
}

export interface ApplicationContentProps {
  description: string;
  message: string;
  discourse?: string;
  appliedAt: string;
}

export interface ApplicationSkillsProps {
  skillRequirements: (string | Skill)[];
  equityAllocation?: number;
  timeframe?: string;
}

export interface ApplicationItemContentProps {
  description: string;
  message: string;
  discourse?: string;
  appliedAt: string;
}
