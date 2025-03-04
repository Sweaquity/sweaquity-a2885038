
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { PastApplicationItem } from "./PastApplicationItem";

interface PastApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const PastApplicationsList = ({ 
  applications = [],
  onApplicationUpdated
}: PastApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  console.log("Past applications:", applications);

  const filteredApplications = applications.filter((application) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    const title = application.business_roles?.title || "";
    const company = application.business_roles?.company_name || "";
    const project = application.business_roles?.project_title || "";
    
    return (
      title.toLowerCase().includes(term) ||
      company.toLowerCase().includes(term) ||
      project.toLowerCase().includes(term)
    );
  });

  if (applications.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">No past applications found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search past applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <PastApplicationItem
            key={application.job_app_id}
            application={application}
            onApplicationUpdated={onApplicationUpdated}
          />
        ))}
      </div>
    </div>
  );
};
