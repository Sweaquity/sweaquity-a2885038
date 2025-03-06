
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useContractManagement = (onUpdate?: () => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  return {
    isUploading,
    isLoading,
    uploadContract,
    updateEquityTerms
  };
};
