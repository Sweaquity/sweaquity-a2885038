
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useWithdrawApplication = (onApplicationUpdated?: () => void) => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdrawApplication = async (applicationId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for withdrawing your application");
      return;
    }

    setIsWithdrawing(true);

    try {
      // Update application to withdrawn status with reason saved in notes field (not task_discourse)
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'withdrawn',
          notes: reason
        })
        .eq('job_app_id', applicationId);

      if (error) throw error;

      toast.success("Application withdrawn successfully");
      setIsWithdrawDialogOpen(false);
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return {
    isWithdrawDialogOpen,
    setIsWithdrawDialogOpen,
    isWithdrawing,
    handleWithdrawApplication
  };
};
