
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useApplicationActions = (onApplicationUpdated?: () => void) => {
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const handleWithdraw = async (applicationId: string) => {
    try {
      console.log("Attempting to withdraw application with ID:", applicationId);
      setIsWithdrawing(applicationId);
      
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('job_app_id', applicationId)
        .select();
      
      console.log("Application withdrawal response:", data);
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log("No changes were made. You may not have permission to withdraw this application.");
        toast.error("Failed to withdraw application. You may not have permission.");
        return;
      }
      
      toast.success("Application withdrawn successfully");
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawing(null);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      setIsUpdatingStatus(applicationId);
      
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('job_app_id', applicationId);
      
      if (error) throw error;
      
      toast.success(`Application status updated to ${status}`);
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Failed to update application status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const openCV = (url: string) => {
    window.open(url, '_blank');
  };

  return {
    isWithdrawing,
    isUpdatingStatus,
    handleWithdraw,
    updateApplicationStatus,
    openCV
  };
};
