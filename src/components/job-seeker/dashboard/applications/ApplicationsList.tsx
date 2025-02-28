
import { useState } from "react";
import { JobApplication, Skill } from "@/types/jobSeeker";
import { ApplicationItem } from "./ApplicationItem";
import { useUserSkills } from "./hooks/useUserSkills";

// Create an EmptyState component since it's missing
const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-gray-50">
    <p className="text-muted-foreground">{message}</p>
  </div>
);

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
  const { userSkills: hookUserSkills, getMatchedSkills } = useUserSkills();
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  
  // Function to get matched skills for an application
  const getMatchedSkillsForApplication = (application: JobApplication) => {
    const requiredSkills = application.business_roles?.skills_required || [];
    const skillNames = (userSkills || hookUserSkills).map(skill => skill.skill.toLowerCase());
    
    return requiredSkills.filter(skill => 
      skillNames.includes(skill.toLowerCase())
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
          getMatchedSkills={getMatchedSkillsForApplication}
          onApplicationUpdated={onApplicationUpdated}
        />
      ))}
    </div>
  );
};
