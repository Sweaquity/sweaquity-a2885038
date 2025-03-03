
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useWithdrawApplication = (onApplicationUpdated?: () => void) => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdrawApplication = async (applicationId: string, reason: string): Promise<void> => {
    if (!applicationId || !reason) {
      toast.error("Application ID and withdrawal reason are required");
      return;
    }
    
    setIsWithdrawing(true);
    
    try {
      // Update the application with the withdrawal reason
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'withdrawn',
          // Store the withdrawal reason in notes instead of task_discourse
          notes: reason
        })
        .eq('job_app_id', applicationId);
      
      if (error) throw error;
      
      toast.success("Application withdrawn successfully");
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error: any) {
      console.error("Error withdrawing application:", error);
      toast.error(error.message || "Failed to withdraw application");
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
