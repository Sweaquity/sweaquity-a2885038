
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication } from "@/types/jobSeeker";
import { useAcceptedJobsCore } from "./useAcceptedJobsCore";

export const useJobAcceptance = (onUpdate?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const { createAcceptedJobEntry, syncMissingAcceptedJobs } = useAcceptedJobsCore(onUpdate);
  
  const acceptJobAsJobSeeker = async (application: JobApplication) => {
    if (!application.job_app_id) {
      toast.error("Invalid application");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Job seeker accepting application:", application.job_app_id);
      
      // First check current state of the application
      const { data: currentApp, error: fetchError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_app_id', application.job_app_id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update the application to set accepted_jobseeker to true
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          accepted_jobseeker: true,
          status: 'accepted'
        })
        .eq('job_app_id', application.job_app_id);
      
      if (error) throw error;
      
      toast.success("You've accepted this job");
      
      // Check if the business has already accepted
      if (currentApp.accepted_business) {
        console.log("Business has already accepted, creating accepted job entry");
        // Both parties have accepted, create accepted_jobs entry
        await createAcceptedJobEntry({
          ...application,
          accepted_business: true,
          accepted_jobseeker: true
        });
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error("Failed to accept job");
    } finally {
      setIsLoading(false);
    }
  };
  
  const acceptJobAsBusiness = async (application: JobApplication) => {
    if (!application.job_app_id) {
      toast.error("Invalid application");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Business accepting application:", application.job_app_id);
      
      // First check current state of the application
      const { data: currentApp, error: fetchError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_app_id', application.job_app_id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update the application to set accepted_business to true
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          accepted_business: true,
          status: 'accepted'
        })
        .eq('job_app_id', application.job_app_id);
      
      if (error) throw error;
      
      toast.success("You've accepted this candidate");
      
      // Check if the job seeker has already accepted
      if (currentApp.accepted_jobseeker) {
        console.log("Job seeker has already accepted, creating accepted job entry");
        // Both parties have accepted, create accepted_jobs entry
        await createAcceptedJobEntry({
          ...application,
          accepted_business: true,
          accepted_jobseeker: true
        });
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error accepting candidate:", error);
      toast.error("Failed to accept candidate");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Utility function to fix any accepted applications missing an accepted_jobs entry
  const syncAcceptedJobs = async () => {
    try {
      setIsLoading(true);
      await syncMissingAcceptedJobs();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error syncing accepted jobs:", error);
      toast.error("Failed to sync accepted jobs");
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    acceptJobAsJobSeeker,
    acceptJobAsBusiness,
    syncAcceptedJobs
  };
};
