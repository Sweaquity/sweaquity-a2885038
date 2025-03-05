
import { ProjectsOverview } from "@/components/job-seeker/ProjectsOverview";
import { DashboardContent } from "@/components/job-seeker/dashboard/DashboardContent";
import { EquityProject, JobApplication, Profile, Skill } from "@/types/jobSeeker";

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
          onLogEffortChange: () => {}
        }}
        refreshApplications={refreshApplications}
      />
    </div>
  );
};
