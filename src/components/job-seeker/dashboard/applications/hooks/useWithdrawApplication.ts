
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useWithdrawApplication = (onApplicationUpdated?: () => void) => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdrawApplication = async (applicationId: string, reason: string) => {
    try {
      setIsWithdrawing(true);
      
      // Update the status to withdrawn and store the reason in notes, not in task_discourse
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'withdrawn',
          notes: reason
        })
        .eq('job_app_id', applicationId);
      
      if (error) throw error;
      
      toast.success("Application withdrawn successfully");
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawing(false);
      setIsWithdrawDialogOpen(false);
    }
  };

  return {
    isWithdrawDialogOpen,
    setIsWithdrawDialogOpen,
    isWithdrawing,
    handleWithdrawApplication
  };
};
