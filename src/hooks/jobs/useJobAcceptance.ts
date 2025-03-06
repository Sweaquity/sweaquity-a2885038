
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication } from "@/types/jobSeeker";
import { useAcceptedJobsCore } from "./useAcceptedJobsCore";

export const useJobAcceptance = (onUpdate?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const { createAcceptedJobEntry } = useAcceptedJobsCore(onUpdate);
  
  const acceptJobAsJobSeeker = async (application: JobApplication) => {
    if (!application.job_app_id) {
      toast.error("Invalid application");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          accepted_jobseeker: true 
        })
        .eq('job_app_id', application.job_app_id);
      
      if (error) throw error;
      
      toast.success("You've accepted this job");
      
      if (application.accepted_business) {
        // Both parties have accepted, create accepted_jobs entry
        await createAcceptedJobEntry(application);
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
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          accepted_business: true 
        })
        .eq('job_app_id', application.job_app_id);
      
      if (error) throw error;
      
      toast.success("You've accepted this candidate");
      
      if (application.accepted_jobseeker) {
        // Both parties have accepted, create accepted_jobs entry
        await createAcceptedJobEntry(application);
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error accepting candidate:", error);
      toast.error("Failed to accept candidate");
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    acceptJobAsJobSeeker,
    acceptJobAsBusiness
  };
};
