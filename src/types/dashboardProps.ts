
import { EquityProject } from './equity';
import { JobApplication } from './applications';
import { Skill } from './profile';

export interface DashboardTabProps {
  activeTab: string;
  profile: any; // Changed from Profile to any to resolve type issue
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
  skillRequirements: any[]; // Changed to any[] to resolve type issue
  equityAllocation?: number;
  timeframe?: string;
}

export interface ApplicationItemContentProps {
  description: string;
  message: string;
  discourse?: string;
  appliedAt: string;
}
