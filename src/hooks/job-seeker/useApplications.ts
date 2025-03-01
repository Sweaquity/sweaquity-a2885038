
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication } from "@/types/jobSeeker";

export const useApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [pastApplications, setPastApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadApplications = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch all job applications for this user
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          business_roles:project_sub_tasks (
            task_id,
            title,
            description,
            timeframe,
            skills_required,
            skill_requirements,
            equity_allocation,
            project:business_projects (
              project_id,
              title,
              business:businesses (
                company_name,
                businesses_id
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      
      // Process the data to make it fit our JobApplication type
      const processedApplications = data.map((app: any) => ({
        ...app,
        id: app.job_app_id, // Ensuring id property is set
        business_roles: {
          title: app.business_roles?.title || "Unknown Role",
          description: app.business_roles?.description || "",
          timeframe: app.business_roles?.timeframe || "",
          skills_required: app.business_roles?.skills_required || [],
          skill_requirements: app.business_roles?.skill_requirements || [],
          equity_allocation: app.business_roles?.equity_allocation,
          company_name: app.business_roles?.project?.business?.company_name,
          project_title: app.business_roles?.project?.title
        }
      }));
      
      // Separate current from past applications (those that are rejected or withdrawn)
      const current = processedApplications.filter((app: JobApplication) => 
        !['rejected', 'withdrawn'].includes(app.status.toLowerCase())
      );
      
      const past = processedApplications.filter((app: JobApplication) => 
        ['rejected', 'withdrawn'].includes(app.status.toLowerCase())
      );
      
      setApplications(current);
      setPastApplications(past);
      
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    applications,
    pastApplications,
    isLoading,
    loadApplications
  };
};
