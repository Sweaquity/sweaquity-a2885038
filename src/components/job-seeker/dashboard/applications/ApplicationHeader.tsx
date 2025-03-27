
import { Button } from "@/components/ui/button";
import { JobApplication } from "@/types/jobSeeker";

interface ApplicationHeaderProps {
  application?: JobApplication;
  isExpanded: boolean;
  toggleExpand: () => void;
  project?: any;
}

export const ApplicationHeader = ({
  application,
  isExpanded,
  toggleExpand,
  project
}: ApplicationHeaderProps) => {
  const title = application?.business_roles?.title || 
               (project?.business_roles?.title || "Untitled Position");
  
  const companyName = application?.business_roles?.company_name || 
                     (project?.business_roles?.company_name || "Unknown Company");

  return (
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{companyName}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleExpand}
      >
        {isExpanded ? "Less Details" : "More Details"}
      </Button>
    </div>
  );
};
