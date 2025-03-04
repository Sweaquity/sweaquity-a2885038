
import { Card } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { PastApplicationItem } from "./PastApplicationItem";
import { useUserSkills } from "./hooks/useUserSkills";

interface PastApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const PastApplicationsList = ({ applications, onApplicationUpdated }: PastApplicationsListProps) => {
  const { getMatchedSkills } = useUserSkills();
  
  console.log("Past applications:", applications.length);
  console.log("Past application statuses:", applications.map(app => app.status));
  
  if (applications.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-center">No past applications found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <PastApplicationItem 
          key={application.job_app_id}
          application={application}
          getMatchedSkills={getMatchedSkills}
        />
      ))}
    </div>
  );
};
