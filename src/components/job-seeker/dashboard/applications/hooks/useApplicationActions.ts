
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useApplicationActions = (onApplicationUpdated?: () => void) => {
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);

  const handleWithdraw = async (applicationId: string) => {
    try {
      setIsWithdrawing(applicationId);
      
      // Update the application status to "withdrawn"
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('job_app_id', applicationId);
      
      if (error) {
        console.error("Error withdrawing application:", error);
        toast.error("Failed to withdraw application");
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

  const openCV = (cvUrl: string) => {
    if (cvUrl) {
      window.open(cvUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("CV URL is not available");
    }
  };

  return {
    isWithdrawing,
    handleWithdraw,
    openCV
  };
};
