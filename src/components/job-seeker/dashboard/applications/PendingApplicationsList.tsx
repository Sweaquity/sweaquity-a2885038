
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { JobApplication, PendingApplicationsListProps } from "@/types/jobSeeker";
import { PendingApplicationItem } from "./PendingApplicationItem";

export const PendingApplicationsList = ({ 
  applications = [],
  onWithdraw = async () => {},
  onAccept = async () => {},
  isWithdrawing = false
}: PendingApplicationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

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
    
    return false;
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
            key={application.job_app_id}
            application={application}
            onWithdraw={onWithdraw}
            onAccept={onAccept}
            isWithdrawing={isWithdrawing}
          />
        ))}
      </div>
    </div>
  );
};
