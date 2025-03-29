
import { useState, useEffect, useCallback } from "react";
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

  // Process applications to determine if they are equity projects
  const processApplications = useCallback(async () => {
    if (applications.length === 0) {
      setProcessedApplications([]);
      return;
    }
    
    try {
      // Get application IDs for querying
      const appIds = applications.map(app => app.job_app_id);
      
      // Fetch equity data from accepted_jobs
      const { data: acceptedJobsData, error } = await supabase
        .from('accepted_jobs')
        .select('job_app_id, equity_agreed, jobs_equity_allocated')
        .in('job_app_id', appIds);
      
      if (error) {
        console.error("Error fetching equity data:", error);
        setProcessedApplications([]);
        return;
      }
      
      // Process each application
      const processed = applications.map(app => {
        // Find the matching accepted job data
        const jobData = acceptedJobsData?.find(job => job.job_app_id === app.job_app_id);
        
        if (!jobData) {
          return { ...app, is_equity_project: false } as JobApplication;
        }
        
        // Mark as completed equity project if all equity has been allocated
        const isEquityCompleted = jobData.jobs_equity_allocated > 0 && 
                          jobData.equity_agreed > 0 && 
                          jobData.jobs_equity_allocated >= jobData.equity_agreed;
                          
        // Only include in the completed list if it matches the isCompleted prop value
        if (isEquityCompleted === isCompleted) {
          return {
            ...app,
            is_equity_project: true,
            accepted_jobs: {
              id: app.job_app_id, // Use job_app_id as fallback for id
              equity_agreed: jobData.equity_agreed || 0,
              jobs_equity_allocated: jobData.jobs_equity_allocated || 0,
              date_accepted: "n/a" // Add a fallback for date_accepted
            }
          } as JobApplication;
        }
        
        return { ...app, is_equity_project: false } as JobApplication;
      });
      
      // Filter and cast to JobApplication[]
      const filteredProcessed = processed.filter(app => app.is_equity_project) as JobApplication[];
      setProcessedApplications(filteredProcessed);
    } catch (err) {
      console.error("Error processing applications:", err);
      setProcessedApplications([]);
    }
  }, [applications, isCompleted]);

  useEffect(() => {
    processApplications();
  }, [applications, processApplications]);

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
