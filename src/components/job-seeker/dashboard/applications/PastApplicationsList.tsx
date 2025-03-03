
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { PastApplicationItem } from "./PastApplicationItem";

interface PastApplicationsListProps {
  applications: JobApplication[];
}

export const PastApplicationsList = ({ applications = [] }: PastApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApplications = applications.filter((application) => {
    const statusesToInclude = ['rejected', 'withdrawn'];
    
    // First, check if the application status is one we want to include
    if (!statusesToInclude.includes(application.status.toLowerCase())) {
      return false;
    }
    
    // If there's no search term, include all applications with the correct status
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    // Check company name
    if (application.business_roles?.company_name && 
        application.business_roles.company_name.toLowerCase().includes(term)) {
      return true;
    }
    
    // Check project title
    if (application.business_roles?.project_title && 
        application.business_roles.project_title.toLowerCase().includes(term)) {
      return true;
    }
    
    // Check role title
    if (application.business_roles?.title && 
        application.business_roles.title.toLowerCase().includes(term)) {
      return true;
    }
    
    // Check skills
    const skills = application.business_roles?.skill_requirements || [];
    return skills.some(skill => {
      if (typeof skill === 'string') {
        return skill.toLowerCase().includes(term);
      }
      if (typeof skill === 'object' && skill && 'skill' in skill && typeof skill.skill === 'string') {
        return skill.skill.toLowerCase().includes(term);
      }
      return false;
    });
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
          />
        ))}
        
        {filteredApplications.length === 0 && (
          <div className="text-center p-4">
            <p className="text-muted-foreground">No past applications match your search</p>
          </div>
        )}
      </div>
    </div>
  );
};
