
import { useState } from "react";
import { ApplicationItem } from "./ApplicationItem";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";

interface ApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsList = ({ 
  applications = [],
  onApplicationUpdated
}: ApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userSkills } = useUserSkills();

  // Helper function to normalize text for case-insensitive searching
  const normalizeText = (text: string | null | undefined): string => {
    return (text || "").toString().toLowerCase().trim();
  };

  const filteredApplications = applications.filter((application) => {
    if (!searchTerm) return true;
    
    const term = normalizeText(searchTerm);
    
    // Check project title
    if (application.business_roles?.project_title && 
        normalizeText(application.business_roles.project_title).includes(term)) {
      return true;
    }
    
    // Check company name
    if (application.business_roles?.company_name && 
        normalizeText(application.business_roles.company_name).includes(term)) {
      return true;
    }
    
    // Check role title
    if (application.business_roles?.title && 
        normalizeText(application.business_roles.title).includes(term)) {
      return true;
    }
    
    // Check skills
    const skills = application.business_roles?.skill_requirements || [];
    return skills.some(skill => {
      if (typeof skill === 'string') {
        return normalizeText(skill).includes(term);
      }
      if (skill && typeof skill === 'object' && 'skill' in skill && typeof skill.skill === 'string') {
        return normalizeText(skill.skill).includes(term);
      }
      return false;
    });
  });

  if (applications.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">No applications found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-container">
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
            key={application.job_app_id || application.id || `app-${Math.random()}`}
            application={application}
            onApplicationUpdated={onApplicationUpdated}
          />
        ))}
      </div>
    </div>
  );
};
