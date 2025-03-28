
import { OpportunitiesTabContent } from "../opportunities/OpportunitiesTabContent";
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
      <OpportunitiesTabContent 
        projects={projects} 
        userSkills={userSkills || []} 
      />
    </div>
  );
};
