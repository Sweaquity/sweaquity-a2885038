
import { JobApplication } from "@/types/jobSeeker";

interface ApplicationContentProps {
  application?: JobApplication;
  project?: any;
}

export const ApplicationContent = ({
  application,
  project
}: ApplicationContentProps) => {
  const description = application?.business_roles?.description || 
                     (project?.business_roles?.description || "No description available.");
  
  const message = application?.message || "";

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Job Description</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
      
      {message && (
        <div>
          <h4 className="font-medium mt-3">Your Application Message</h4>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      )}
    </div>
  );
};
