
import { OpportunitiesTab as OpportunitiesTabComponent } from "@/components/job-seeker/dashboard/OpportunitiesTab";
import { EquityProject, Skill } from "@/types/jobSeeker";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[] | [];
}

export const OpportunitiesTab = ({
  projects,
  userSkills,
}: OpportunitiesTabProps) => {
  return (
    <div className="space-y-6">
      <OpportunitiesTabComponent 
        projects={projects} 
        userSkills={userSkills || []} 
      />
    </div>
  );
};
