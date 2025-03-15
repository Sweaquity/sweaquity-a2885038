
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
      
      // Check if an entry already exists
      const { data: existingEntry } = await supabase
        .from('accepted_jobs')
        .select('id')
        .eq('job_app_id', application.job_app_id)
        .maybeSingle();
        
      if (existingEntry) {
        console.log("Entry already exists for this application");
        return;
      }
      
      const { error } = await supabase
        .from('accepted_jobs')
        .insert({
          job_app_id: application.job_app_id,
          equity_agreed: application.business_roles?.equity_allocation || 0
        });
      
      if (error) throw error;
      
      toast.success("Agreement created successfully");
      console.log("Agreement created successfully for application:", application.job_app_id);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error creating agreement:", error);
      toast.error("Failed to create agreement");
    }
  };
  
  const getAcceptedJob = async (jobAppId: string): Promise<AcceptedJob | null> => {
    try {
      const { data, error } = await supabase
        .from('accepted_jobs')
        .select('*')
        .eq('job_app_id', jobAppId)
        .single();
      
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
