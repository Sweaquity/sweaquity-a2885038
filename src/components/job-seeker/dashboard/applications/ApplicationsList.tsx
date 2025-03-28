
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { ApplicationItem } from "./ApplicationItem";

interface ApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsList = ({ 
  applications = [], 
  onApplicationUpdated = () => {} 
}: ApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApplications = applications.filter((application) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    // Check project title
    if (application.business_roles?.project_title && 
        String(application.business_roles.project_title).toLowerCase().includes(term)) {
      return true;
    }
    
    // Check company name
    if (application.business_roles?.company_name && 
        String(application.business_roles.company_name).toLowerCase().includes(term)) {
      return true;
    }
    
    // Check role title
    if (application.business_roles?.title && 
        String(application.business_roles.title).toLowerCase().includes(term)) {
      return true;
    }
    
    return false;
  });

  if (applications.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">No current applications found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <ApplicationItem
            key={application.job_app_id || application.id}
            application={application}
            onApplicationUpdated={onApplicationUpdated}
          />
        ))}
      </div>
    </div>
  );
};
