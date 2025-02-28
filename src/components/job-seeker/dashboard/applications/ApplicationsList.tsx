
import { JobApplication } from "@/types/jobSeeker";
import { ApplicationItem } from "./ApplicationItem";

interface ApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsList = ({ applications, onApplicationUpdated = () => {} }: ApplicationsListProps) => {
  return (
    <>
      {applications.map(application => (
        <ApplicationItem
          key={application.job_app_id}
          application={application}
          onApplicationUpdated={onApplicationUpdated}
        />
      ))}
    </>
  );
};
