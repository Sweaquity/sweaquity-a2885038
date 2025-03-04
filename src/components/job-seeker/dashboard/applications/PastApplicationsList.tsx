import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { PastApplicationItem } from "./PastApplicationItem";
import { Card } from "@/components/ui/card"; 

interface PastApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const PastApplicationsList = ({ 
  applications = [],
  onApplicationUpdated
}: PastApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userSkills, getMatchedSkills } = useUserSkills();

  // Filter to only include rejected or withdrawn applications
  // This happens at the parent component (ApplicationsTab) already,
  // so we'll keep all applications passed to this component
  const pastApplications = applications;

  const filteredApplications = pastApplications.filter((application) => {
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
    
    // Check notes (withdrawal reason)
    if (application.notes && 
        String(application.notes).toLowerCase().includes(term)) {
      return true;
    }
    
    // Check skills
    const skills = application.business_roles?.skill_requirements || [];
    return skills.some(skill => {
      if (typeof skill === 'string') {
        return String(skill).toLowerCase().includes(term);
      }
      if (skill && typeof skill === 'object' && 'skill' in skill && typeof skill.skill === 'string') {
        return String(skill.skill).toLowerCase().includes(term);
      }
      return false;
    });
  });

  // Debug information
  console.log("Applications received:", applications.length);
  console.log("Filtered applications:", filteredApplications.length);
  console.log("Application status values:", applications.map(app => app.status));

  if (pastApplications.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">No rejected or withdrawn applications found</p>
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
        {filteredApplications.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            No matches found for "{searchTerm}"
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <PastApplicationItem
              key={application.job_app_id}
              application={application}
              getMatchedSkills={() => getMatchedSkills(application)}
            />
          ))
        )}
      </div>
    </div>
  );
};
