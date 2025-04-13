
import { JobApplication } from './consolidatedTypes';
import { LogEffort } from './consolidatedTypes';
import { ParsedCVData } from './jobSeeker'; 
import { Profile } from './jobSeeker';
import { Skill, EquityProject, SkillRequirement } from './consolidatedTypes';

// JobSeeker Dashboard Props
export interface JobSeekerDashboardProps {
  profile: Profile | null;
  applications: JobApplication[];
  cvUrl: string | null;
  equityProjects: EquityProject[];
  availableOpportunities: any[];
  skills: Skill[];
  parsedCvData?: ParsedCVData;
  isLoading: boolean;
  
  handleSignOut: () => Promise<void>;
  handleCvUpload: (file: File) => Promise<boolean>;
  handleProfileUpdate: (data: any) => Promise<boolean>;
  handleSkillsUpdate: (skills: Skill[]) => Promise<boolean>;
  refreshApplications: () => Promise<void>;
  handleAcceptJob: (jobAppId: string) => Promise<boolean>;
  handleWithdrawApplication: (jobAppId: string, reason?: string) => Promise<boolean>;
  handleLogEffort: (effort: LogEffort) => Promise<boolean>;
  handleTicketAction: (ticketId: string, action: string, data?: any) => Promise<void>;
  hasBusinessProfile: boolean;
}

// ProjectCard Props for job opportunities
export interface ProjectCardProps {
  project: any;
  userSkills: Skill[];
  onApply?: (taskId: string, projectId: string) => void;
}

// SubTask Props for job opportunities
export interface SubTaskProps {
  subTask: {
    id: string;
    title: string;
    description?: string;
    equity_allocation: number;
    skill_requirements?: SkillRequirement[];
  };
  skillMatch: number;
  onApply: () => void;
}
