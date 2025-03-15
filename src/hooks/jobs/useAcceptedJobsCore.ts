
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication } from "@/types/jobSeeker";

export interface AcceptedJob {
  id: string;
  job_app_id: string;
  date_accepted: string;
  document_url: string | null;
  accepted_discourse: string | null;
  equity_agreed: number;
}

export const useAcceptedJobsCore = (onUpdate?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const createAcceptedJobEntry = async (application: JobApplication) => {
    try {
      console.log("Creating accepted job entry for application:", application.job_app_id);
      setIsLoading(true);
      
      // Check if an entry already exists
      const { data: existingEntry, error: checkError } = await supabase
        .from('accepted_jobs')
        .select('id')
        .eq('job_app_id', application.job_app_id)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking existing entry:", checkError);
        throw checkError;
      }
      
      if (existingEntry) {
        console.log("Entry already exists for this application", existingEntry);
        return;
      }
      
      // Get equity allocation from business_roles
      let equityAllocation = 0;
      if (application.business_roles?.equity_allocation) {
        equityAllocation = application.business_roles.equity_allocation;
      }
      
      console.log("Creating new accepted job with equity allocation:", equityAllocation);
      
      const { data, error } = await supabase
        .from('accepted_jobs')
        .insert({
          job_app_id: application.job_app_id,
          equity_agreed: equityAllocation
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error inserting accepted job:", error);
        throw error;
      }
      
      console.log("Successfully created accepted job:", data);
      toast.success("Agreement created successfully");
      
      if (onUpdate) onUpdate();
      return data;
    } catch (error) {
      console.error("Error creating agreement:", error);
      toast.error("Failed to create agreement");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAcceptedJob = async (jobAppId: string): Promise<AcceptedJob | null> => {
    try {
      const { data, error } = await supabase
        .from('accepted_jobs')
        .select('*')
        .eq('job_app_id', jobAppId)
        .maybeSingle();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Error fetching accepted job:", error);
      return null;
    }
  };
  
  return {
    isLoading,
    setIsLoading,
    createAcceptedJobEntry,
    getAcceptedJob
  };
};
