
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { PastApplicationItem } from "./PastApplicationItem";

interface PastApplicationsListProps {
  applications: JobApplication[];
}

export const PastApplicationsList = ({ 
  applications = []
}: PastApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userSkills, getMatchedSkills } = useUserSkills();

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
            getMatchedSkills={() => getMatchedSkills(application)}
          />
        ))}
      </div>
    </div>
  );
};
