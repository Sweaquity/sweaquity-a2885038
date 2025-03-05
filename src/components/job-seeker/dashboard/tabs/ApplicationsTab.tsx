
import { ApplicationsTab as ApplicationsTabComponent } from "@/components/job-seeker/dashboard/applications";
import { JobApplication } from "@/types/jobSeeker";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
}

export const ApplicationsTab = ({
  applications,
  onApplicationUpdated,
}: ApplicationsTabProps) => {
  return (
    <div className="space-y-6">
      <ApplicationsTabComponent 
        applications={applications} 
        onApplicationUpdated={onApplicationUpdated}
      />
    </div>
  );
};
