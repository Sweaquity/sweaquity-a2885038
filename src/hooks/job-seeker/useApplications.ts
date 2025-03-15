
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication, SkillRequirement } from "@/types/jobSeeker";

export const useApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingRef = useRef(false); // Prevent multiple simultaneous loads

  const loadApplications = async (userId: string) => {
    // Prevent multiple simultaneous loadApplications calls
    if (isLoadingRef.current) {
      console.log("Already loading applications, skipping redundant call");
      return;
    }
    
    try {
      setIsLoading(true);
      isLoadingRef.current = true;
      
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
            skill_requirements,
            equity_allocation,
            completion_percentage,
            task_status,
            project:business_projects (
              project_id,
              title,
              business:businesses (
                company_name
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      
      console.log("Fetched applications:", data.length);
      
      // Process the data to make it fit our JobApplication type
      const processedApplications = data.map((app: any) => {
        // Get company name from businesses relation
        const companyName = app.business_roles?.project?.business?.company_name || "Unknown Company";
        
        // Properly format skill_requirements to match SkillRequirement type
        const skillRequirements = app.business_roles?.skill_requirements || [];
        const formattedSkillRequirements = skillRequirements.map((req: any) => {
          if (typeof req === 'string') {
            return req;
          }
          
          // Ensure level is one of the allowed values
          const level = ['Beginner', 'Intermediate', 'Expert'].includes(req.level) 
            ? req.level as 'Beginner' | 'Intermediate' | 'Expert'
            : 'Intermediate';
            
          return { 
            skill: req.skill, 
            level 
          } as SkillRequirement;
        });
        
        return {
          ...app,
          id: app.job_app_id, // Ensuring id property is set
          status: app.status || "", // Ensure status is never undefined
          business_roles: app.business_roles ? {
            title: app.business_roles?.title || "Unknown Role",
            description: app.business_roles?.description || "",
            timeframe: app.business_roles?.timeframe || "",
            skill_requirements: formattedSkillRequirements,
            equity_allocation: app.business_roles?.equity_allocation,
            completion_percentage: app.business_roles?.completion_percentage,
            task_status: app.business_roles?.task_status,
            company_name: companyName,
            project_title: app.business_roles?.project?.title
          } : undefined
        };
      });
      
      // Set all applications without filtering
      setApplications(processedApplications);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  return {
    applications,
    isLoading,
    loadApplications
  };
};
