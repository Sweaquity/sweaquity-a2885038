
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication, Skill } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { PendingApplicationItem } from "./PendingApplicationItem";
import { Card } from "@/components/ui/card";

interface AllApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const AllApplicationsList = ({ 
  applications = [],
  onApplicationUpdated
}: AllApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userSkills, getMatchedSkills } = useUserSkills();

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
    
    // Check status
    if (application.status && 
        normalizeText(application.status).includes(term)) {
      return true;
    }
    
    // Check skills
    const skills = application.business_roles?.skill_requirements || [];
    return skills.some(skill => {
      if (typeof skill === 'string') {
        return normalizeText(skill).includes(term);
      }
      if (typeof skill === 'object' && skill && 'skill' in skill) {
        return normalizeText(skill.skill).includes(term);
      }
      return false;
    });
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search all applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            {searchTerm 
              ? `No matches found for "${searchTerm}"` 
              : "No applications found"}
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <PendingApplicationItem
              key={application.job_app_id}
              application={application}
              onApplicationUpdated={onApplicationUpdated}
              getMatchedSkills={() => getMatchedSkills(application)}
            />
          ))
        )}
      </div>
    </div>
  );
};
