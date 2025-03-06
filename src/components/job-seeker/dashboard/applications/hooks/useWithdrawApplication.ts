
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useWithdrawApplication = (onApplicationUpdated?: () => void) => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdrawApplication = async (applicationId: string, reason?: string) => {
    try {
      setIsWithdrawing(true);
      
      // Update only the status to withdrawn, reason is optional
      const updateData: any = { status: 'withdrawn' };
      
      // Only store the reason in notes if provided
      if (reason) {
        updateData.notes = reason;
      }
      
      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
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
