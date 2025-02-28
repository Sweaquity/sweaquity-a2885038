
import { JobApplication } from "@/types/jobSeeker";
import { useState } from "react";
import { useUserSkills } from "./hooks/useUserSkills";
import { ApplicationItem } from "./ApplicationItem";

interface ApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsList = ({ applications, onApplicationUpdated = () => {} }: ApplicationsListProps) => {
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());
  const { userSkills, getMatchedSkills } = useUserSkills();

  const toggleApplicationExpanded = (applicationId: string) => {
    setExpandedApplications(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(applicationId)) {
        newExpanded.delete(applicationId);
      } else {
        newExpanded.add(applicationId);
      }
      return newExpanded;
    });
  };

  return (
    <>
      {applications.map(application => (
        <ApplicationItem
          key={application.job_app_id}
          application={application}
          isExpanded={expandedApplications.has(application.job_app_id)}
          toggleExpanded={() => toggleApplicationExpanded(application.job_app_id)}
          getMatchedSkills={getMatchedSkills}
          onApplicationUpdated={onApplicationUpdated}
        />
      ))}
    </>
  );
};
