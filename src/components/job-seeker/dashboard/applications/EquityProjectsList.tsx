
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";
import { EquityProjectItem } from "./EquityProjectItem";
import { supabase } from "@/lib/supabase";

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
  const [processedApplications, setProcessedApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    // Process applications to determine if they are equity projects
    const processApplications = async () => {
      const processed = await Promise.all(applications.map(async (app) => {
        if (app.accepted_jobs) {
          // It's already marked as an equity project with accepted_jobs data
          return { ...app, is_equity_project: true };
        }
        
        // Check if there's an accepted_jobs entry for this application
        try {
          const { data, error } = await supabase
            .from('accepted_jobs')
            .select('equity_agreed, jobs_equity_allocated')
            .eq('job_app_id', app.job_app_id)
            .single();
            
          if (error) {
            console.error("Error checking for equity data:", error);
            return { ...app, is_equity_project: false };
          }
          
          return { 
            ...app, 
            is_equity_project: true,
            accepted_jobs: data
          };
        } catch (err) {
          console.error("Error processing application:", err);
          return { ...app, is_equity_project: false };
        }
      }));
      
      setProcessedApplications(processed);
    };
    
    if (applications.length > 0) {
      processApplications();
    } else {
      setProcessedApplications([]);
    }
  }, [applications]);

  const filteredApplications = processedApplications.filter((application) => {
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

  if (processedApplications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {isCompleted ? "No completed equity projects found" : "No active equity projects found"}
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
          />
        ))}
      </div>
    </div>
  );
};
