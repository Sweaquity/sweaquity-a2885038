
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { JobApplication, Skill, SkillRequirement } from "@/types/jobSeeker";
import { ApplicationItem } from "./ApplicationItem";
import { useUserSkills } from "./hooks/useUserSkills";

interface PendingApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const PendingApplicationsList = ({ applications, onApplicationUpdated }: PendingApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { userSkills } = useUserSkills();
  
  // Convert user skills to lowercase strings for easier matching
  const userSkillsLower = userSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : skill.skill.toLowerCase()
  );

  // Filter applications based on search term and skills match
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === "" || 
      (app.business_roles?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       app.business_roles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       app.business_roles?.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Sort applications: skill matches first, then by applied date
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    // Calculate skill match scores
    const aSkillMatch = calculateSkillMatch(a, userSkillsLower);
    const bSkillMatch = calculateSkillMatch(b, userSkillsLower);
    
    // First sort by skill match (higher first)
    if (aSkillMatch !== bSkillMatch) {
      return bSkillMatch - aSkillMatch;
    }
    
    // Then sort by applied date (newest first)
    return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
  });

  // Helper to calculate skill match percentage
  function calculateSkillMatch(app: JobApplication, userSkills: string[]): number {
    if (!app.business_roles?.skill_requirements || userSkills.length === 0) {
      return 0;
    }
    
    // Extract skills from the application
    const appSkills: string[] = [];
    (app.business_roles.skill_requirements || []).forEach(req => {
      if (typeof req === 'string') {
        appSkills.push(req.toLowerCase());
      } else if (typeof req === 'object' && req !== null && 'skill' in req) {
        appSkills.push((req as SkillRequirement).skill.toLowerCase());
      }
    });
    
    if (appSkills.length === 0) return 0;
    
    // Count matching skills
    const matches = userSkills.filter(skill => appSkills.includes(skill)).length;
    return Math.round((matches / appSkills.length) * 100);
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background pt-2 pb-2">
        <Input
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {sortedApplications.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No pending applications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedApplications.map((application) => (
            <ApplicationItem
              key={application.job_app_id}
              application={application}
              onApplicationUpdated={onApplicationUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
};
