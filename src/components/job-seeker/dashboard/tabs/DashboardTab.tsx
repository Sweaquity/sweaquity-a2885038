
import { ProjectsOverview } from "@/components/job-seeker/ProjectsOverview";
import { DashboardContent } from "@/components/job-seeker/dashboard/DashboardContent";
import { EquityProject, JobApplication, Profile, Skill } from "@/types/jobSeeker";
import { CVFile } from "@/hooks/job-seeker/useCVData";

interface DashboardTabProps {
  activeTab: string;
  profile: Profile | null;
  cvUrl: string | null;
  parsedCvData: any;
  skills: Skill[] | null;
  applications: JobApplication[];
  equityProjects: EquityProject[];
  availableOpportunities: EquityProject[];
  handleSkillsUpdate: (updatedSkills: Skill[]) => Promise<void>;
  refreshApplications: () => void;
  onDocumentAction: (projectId: string, action: 'edit' | 'approve') => void;
  userCVs?: CVFile[];
  onCvListUpdated?: () => void;
}

export const DashboardTab = ({
  activeTab,
  profile,
  cvUrl,
  parsedCvData,
  skills,
  applications,
  equityProjects,
  availableOpportunities,
  handleSkillsUpdate,
  refreshApplications,
  onDocumentAction,
  userCVs = [],
  onCvListUpdated = () => {},
}: DashboardTabProps) => {
  return (
    <div className="space-y-6">
      <ProjectsOverview 
        currentProjects={equityProjects} 
        pastProjects={[]} 
        onDocumentAction={onDocumentAction}
      />
      <DashboardContent
        activeTab={activeTab}
        dashboardData={{
          profile,
          cvUrl,
          parsedCvData,
          setCvUrl: () => {},
          setParsedCvData: () => {},
          skills,
          handleSkillsUpdate,
          applications,
          availableOpportunities,
          equityProjects,
          logEffort: null,
          onLogEffort: () => {},
          onLogEffortChange: () => {},
          userCVs,
          onCvListUpdated
        }}
        refreshApplications={refreshApplications}
      />
    </div>
  );
};
