
import { useState } from "react";
import { JobApplication, Skill } from "@/types/jobSeeker";
import { ApplicationItem } from "./ApplicationItem";
import { EmptyState } from "../EmptyState";
import { useUserSkills } from "./hooks/useUserSkills";

interface ApplicationsListProps {
  applications: JobApplication[];
  userSkills?: Skill[];
  emptyMessage?: string;
  onApplicationUpdated?: () => void;
}

export const ApplicationsList = ({
  applications,
  userSkills = [],
  emptyMessage = "You haven't applied to any opportunities yet.",
  onApplicationUpdated,
}: ApplicationsListProps) => {
  const { getUserSkillNames } = useUserSkills(userSkills);
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  
  // Function to get matched skills for an application
  const getMatchedSkills = (application: JobApplication) => {
    const userSkillNames = getUserSkillNames();
    const requiredSkills = application.business_roles?.skills_required || [];
    
    return requiredSkills.filter(skill => 
      userSkillNames.some(userSkill => 
        userSkill.toLowerCase() === skill.toLowerCase()
      )
    );
  };
  
  if (applications.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }
  
  return (
    <div className="space-y-4">
      {applications.map(application => (
        <ApplicationItem 
          key={application.job_app_id} 
          application={application}
          isExpanded={expandedApplicationId === application.job_app_id}
          toggleExpanded={() => {
            setExpandedApplicationId(
              expandedApplicationId === application.job_app_id 
                ? null 
                : application.job_app_id
            );
          }}
          getMatchedSkills={getMatchedSkills}
          onApplicationUpdated={onApplicationUpdated}
        />
      ))}
    </div>
  );
};
