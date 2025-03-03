
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useApplicationActions = (onSuccess?: () => void) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);

  const updateApplicationStatus = async (applicationId: string, newStatus: string, rejectionNote?: string) => {
    try {
      setIsUpdatingStatus(applicationId);

      let updateData: any = { status: newStatus };
      
      // If there's a rejection note, update the task_discourse field
      if (rejectionNote && newStatus === 'rejected') {
        const { data: applicationData } = await supabase
          .from('job_applications')
          .select('task_discourse')
          .eq('job_app_id', applicationId)
          .single();
          
        const timestamp = new Date().toLocaleString();
        const rejectMessage = `[${timestamp}] Business: ${rejectionNote} (Rejection reason)`;
        
        updateData.task_discourse = applicationData?.task_discourse 
          ? `${applicationData.task_discourse}\n\n${rejectMessage}`
          : rejectMessage;
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('job_app_id', applicationId);

      if (error) throw error;

      toast.success(`Application ${newStatus.toLowerCase()}`);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error updating application status:', error);
      toast.error(error.message || "Failed to update application status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const withdrawApplication = async (applicationId: string, withdrawalReason?: string) => {
    try {
      setIsWithdrawing(applicationId);

      let updateData: any = { status: 'withdrawn' };
      
      // If there's a withdrawal reason, update the task_discourse field
      if (withdrawalReason) {
        const { data: applicationData } = await supabase
          .from('job_applications')
          .select('task_discourse')
          .eq('job_app_id', applicationId)
          .single();
          
        const timestamp = new Date().toLocaleString();
        const withdrawMessage = `[${timestamp}] You: ${withdrawalReason} (Withdrawal reason)`;
        
        updateData.task_discourse = applicationData?.task_discourse 
          ? `${applicationData.task_discourse}\n\n${withdrawMessage}`
          : withdrawMessage;
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('job_app_id', applicationId);

      if (error) throw error;

      toast.success("Application withdrawn successfully");
      if (onSuccess) onSuccess();
      
      return true;
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      toast.error(error.message || "Failed to withdraw application");
      return false;
    } finally {
      setIsWithdrawing(null);
    }
  };

  return {
    isUpdatingStatus,
    isWithdrawing,
    updateApplicationStatus,
    withdrawApplication
  };
};
