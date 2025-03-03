
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useWithdrawApplication = (onApplicationUpdated?: () => void) => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdrawApplication = async (applicationId: string, reason: string) => {
    if (!applicationId || !reason) {
      toast.error("Application ID and withdrawal reason are required");
      return;
    }
    
    setIsWithdrawing(true);
    
    try {
      // First, get the current task_discourse value if any
      const { data: applicationData } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', applicationId)
        .single();
        
      // Update the application with the withdrawal reason
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'withdrawn',
          // Note that we're using the withdrawal reason directly rather than updating task_discourse
          notes: reason
        })
        .eq('job_app_id', applicationId);
      
      if (error) throw error;
      
      toast.success("Application withdrawn successfully");
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
      
      return true;
    } catch (error: any) {
      console.error("Error withdrawing application:", error);
      toast.error(error.message || "Failed to withdraw application");
      return false;
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
