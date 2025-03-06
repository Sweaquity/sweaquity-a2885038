
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { PastApplicationItem } from "./PastApplicationItem";
import { useUserSkills } from "./hooks/useUserSkills";

interface PastApplicationsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const PastApplicationsList = ({ applications, onApplicationUpdated }: PastApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { getMatchedSkills } = useUserSkills();
  
  // Debug to check applications
  console.log("Past applications received:", applications.map(app => ({id: app.job_app_id, status: app.status})));
  
  // Helper function to normalize text for case-insensitive searching
  const normalizeText = (text: string | null | undefined): string => {
    return (text || "").toString().toLowerCase().trim();
  };
  
  // Filter applications by search term
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
    
    return false;
  });

  // Check we're actually getting applications passed in
  if (!applications || applications.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-center">No past applications found.</p>
      </Card>
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
          <Card className="p-4">
            <p className="text-muted-foreground text-center">
              {searchTerm ? `No results found for "${searchTerm}"` : 'No past applications found.'}
            </p>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <PastApplicationItem 
              key={application.job_app_id || application.id}
              application={application}
              getMatchedSkills={getMatchedSkills}
            />
          ))
        )}
      </div>
    </div>
  );
};
