
import { useState } from "react";
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

export const useAcceptedJobs = (onUpdate?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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
      // First update the task_discourse with business acceptance message
      const currentDate = new Date().toISOString();
      const acceptMessage = `[${currentDate}] Business accepted the job offer.`;
      
      let existingDiscourse = application.task_discourse || '';
      const updatedDiscourse = existingDiscourse ? `${existingDiscourse}\n${acceptMessage}` : acceptMessage;
      
      // Update both accepted_business and task_discourse in one go
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          accepted_business: true,
          task_discourse: updatedDiscourse
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
  
  const createAcceptedJobEntry = async (application: JobApplication) => {
    try {
      const { error } = await supabase
        .from('accepted_jobs')
        .insert({
          job_app_id: application.job_app_id,
          equity_agreed: application.business_roles?.equity_allocation || 0
        });
      
      if (error) throw error;
      
      toast.success("Agreement created successfully");
    } catch (error) {
      console.error("Error creating agreement:", error);
      toast.error("Failed to create agreement");
    }
  };
  
  const uploadContract = async (jobAppId: string, file: File) => {
    if (!jobAppId || !file) {
      toast.error("Missing required information");
      return null;
    }
    
    setIsUploading(true);
    
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobAppId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);
      
      // Update the accepted_jobs record with the document URL
      const { error: updateError } = await supabase
        .from('accepted_jobs')
        .update({ document_url: publicUrl })
        .eq('job_app_id', jobAppId);
      
      if (updateError) throw updateError;
      
      toast.success("Contract uploaded successfully");
      
      if (onUpdate) onUpdate();
      
      return publicUrl;
    } catch (error) {
      console.error("Error uploading contract:", error);
      toast.error("Failed to upload contract");
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const updateEquityTerms = async (jobAppId: string, equityAmount: number, discourse: string) => {
    if (!jobAppId) {
      toast.error("Invalid job application");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('accepted_jobs')
        .update({ 
          equity_agreed: equityAmount,
          accepted_discourse: discourse
        })
        .eq('job_app_id', jobAppId);
      
      if (error) throw error;
      
      toast.success("Equity terms updated successfully");
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating equity terms:", error);
      toast.error("Failed to update equity terms");
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
    isUploading,
    acceptJobAsJobSeeker,
    acceptJobAsBusiness,
    uploadContract,
    updateEquityTerms,
    getAcceptedJob
  };
};
