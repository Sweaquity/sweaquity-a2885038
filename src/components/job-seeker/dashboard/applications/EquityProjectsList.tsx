
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { EquityProjectItem } from "./EquityProjectItem";
import { Card, CardContent } from "@/components/ui/card";

interface EquityProjectsListProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
  isCompleted?: boolean;
}

export const EquityProjectsList = ({ 
  applications = [],
  onApplicationUpdated = () => {},
  isCompleted = false
}: EquityProjectsListProps) => {
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
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-4">
            <p className="text-muted-foreground">
              {isCompleted 
                ? "No completed equity projects found" 
                : "No active equity projects found"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${isCompleted ? 'completed' : 'active'} equity projects...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <EquityProjectItem
            key={application.job_app_id}
            application={application}
            onApplicationUpdated={onApplicationUpdated}
            isCompleted={isCompleted}
          />
        ))}
      </div>
    </div>
  );
};
