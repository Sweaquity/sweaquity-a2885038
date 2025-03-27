
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { PendingApplicationItem } from "./PendingApplicationItem";

interface PendingApplicationsListProps {
  applications: JobApplication[];
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
  onApplicationUpdated?: () => void;
}

export const PendingApplicationsList = ({ 
  applications = [],
  onWithdraw,
  onAccept,
  isWithdrawing = false,
  onApplicationUpdated
}: PendingApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userSkills, getMatchedSkills } = useUserSkills();

  // Helper function to normalize text for case-insensitive searching
  const normalizeText = (text: string | null | undefined): string => {
    return (text || "").toString().toLowerCase().trim();
  };

  const filteredApplications = applications.filter((application) => {
    if (!searchTerm) return true;
    
    const term = normalizeText(searchTerm);
    
    // Check skills (safely)
    const skills = application.skills_required || application.business_roles?.skill_requirements || [];
    const applicantSkills = application.applicant_skills || [];
    
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
        <p className="text-muted-foreground">No pending applications found</p>
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
          <PendingApplicationItem
            key={application.job_app_id || application.id || `app-${Math.random()}`}
            application={application}
            onAccept={onAccept}
            onWithdraw={onWithdraw}
            isWithdrawing={isWithdrawing}
            getMatchedSkills={getMatchedSkills}
            onApplicationUpdated={onApplicationUpdated}
          />
        ))}
      </div>
    </div>
  );
};
