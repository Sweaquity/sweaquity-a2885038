
import { ApplicationsTab as ApplicationsTabComponent } from "@/components/job-seeker/dashboard/applications";
import { JobApplication } from "@/types/jobSeeker";
import { useCallback } from "react";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const ApplicationsTab = ({
  applications,
  onApplicationUpdated,
}: ApplicationsTabProps) => {
  // Use useCallback to prevent recreation of the function on every render
  const handleApplicationUpdated = useCallback(() => {
    onApplicationUpdated();
  }, [onApplicationUpdated]);

  return (
    <div className="space-y-6">
      <ApplicationsTabComponent 
        applications={applications} 
        onApplicationUpdated={handleApplicationUpdated}
      />
    </div>
  );
};
