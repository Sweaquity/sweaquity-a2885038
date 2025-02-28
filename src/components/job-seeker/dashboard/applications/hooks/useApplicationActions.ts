
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useApplicationActions = (onApplicationUpdated?: () => void) => {
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);

  const handleWithdraw = async (applicationId: string) => {
    try {
      setIsWithdrawing(applicationId);
      
      // Update only the application status to 'withdrawn'
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('job_app_id', applicationId);
      
      if (error) {
        console.error("Update error:", error);
        throw error;
      }
      
      toast.success("Application withdrawn successfully");
      
      // Call the callback function to refresh the applications list
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }

    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawing(null);
    }
  };

  const openCV = async (cvUrl: string) => {
    try {
      if (!cvUrl) {
        toast.error("No CV URL provided");
        return;
      }
      
      // Simply open the CV URL directly in a new tab
      window.open(cvUrl, '_blank', 'noopener,noreferrer');
      
    } catch (err) {
      console.error("Error opening CV:", err);
      toast.error("Failed to open CV");
    }
  };

  return {
    isWithdrawing,
    handleWithdraw,
    openCV
  };
};
