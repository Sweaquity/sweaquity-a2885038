
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication, Skill } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { PendingApplicationItem } from "./PendingApplicationItem";
import { Card } from "@/components/ui/card";

interface PendingApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const PendingApplicationsList = ({ 
  applications = [],
  onApplicationUpdated
}: PendingApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userSkills, getMatchedSkills } = useUserSkills();

  const filteredApplications = applications.filter((application) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    // Check project title
    if (application.business_roles?.project_title && 
        application.business_roles.project_title.toLowerCase().includes(term)) {
      return true;
    }
    
    // Check company name
    if (application.business_roles?.company_name && 
        application.business_roles.company_name.toLowerCase().includes(term)) {
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
      if (typeof skill === 'object' && skill && 'skill' in skill) {
        return skill.skill.toLowerCase().includes(term);
      }
      return false;
    });
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pending applications..."
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
              : "No pending applications found"}
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
